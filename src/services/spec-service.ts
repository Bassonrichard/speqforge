import { db } from '@/lib/db';
import { llmGateway } from '@/services/llm-gateway';
import { templateService } from '@/services/template-service';

export interface GenerateSpecParams {
  featureId: string;
  featureDescription: string;
  featureTitle: string;
  projectName: string;
  templateId?: string;
  orgId: string;
}

export interface SpecRevisionData {
  id: string;
  featureId: string;
  revNumber: number;
  branchName: string;
  commitSha: string;
  isActive: boolean;
  status: string;
  content?: string;
  createdAt: Date;
}

export class SpecService {
  /**
   * Generate a new spec from a feature description
   */
  async generateSpec(params: GenerateSpecParams): Promise<SpecRevisionData> {
    const {
      featureId,
      featureDescription,
      featureTitle,
      projectName,
      templateId,
      orgId,
    } = params;

    // Get the template to use
    const template = templateId
      ? await db.specTemplate.findUnique({ where: { id: templateId } })
      : await templateService.getActiveTemplate(orgId);

    if (!template) {
      throw new Error('No template found');
    }

    // Get project info to generate branch name
    const feature = await db.feature.findUnique({
      where: { id: featureId },
      include: {
        project: true,
      },
    });

    if (!feature) {
      throw new Error('Feature not found');
    }

    // Determine revision number (increment from latest)
    const latestRevision = await db.specRevision.findFirst({
      where: { featureId },
      orderBy: { revNumber: 'desc' },
    });

    const revNumber = latestRevision ? latestRevision.revNumber + 1 : 1;

    // Generate branch name
    const featureSlug = featureTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50);
    const branchName = `spec/${feature.project.projectKey}/${featureId
      .slice(-8)}-${featureSlug}${revNumber > 1 ? `-r${revNumber}` : ''}`;

    // Fill in the KNOWN metadata placeholders first (before LLM call)
    const now = new Date().toISOString().split('T')[0];
    const partiallyFilledTemplate = templateService.fillTemplate(template.content, {
      FEATURE_ID: featureId.slice(-8),
      FEATURE_TITLE: featureTitle,
      PROJECT_NAME: projectName,
      CREATED_DATE: now,
      STATUS: 'DRAFT',
      FEATURE_DESCRIPTION: featureDescription,
    });

    // Build the prompt for LLM with the partially-filled template
    const prompt = this.buildGenerationPrompt(
      featureTitle,
      featureDescription,
      projectName,
      partiallyFilledTemplate
    );

    // Call LLM to generate spec
    const generatedContent = await llmGateway.callProvider(
      prompt,
      undefined, // Use org's default provider
      orgId
    );

    // The LLM should return the complete spec with all sections filled
    const finalContent = generatedContent;

    // Create SpecRevision in database
    const specRevision = await db.specRevision.create({
      data: {
        featureId,
        revNumber,
        branchName,
        commitSha: '', // Will be filled by sync service
        isActive: true,
        status: 'DRAFT',
      },
    });

    // Store the content separately (you might want to add a content field to SpecRevision)
    // For now, we'll return it and let the caller handle storage

    return {
      ...specRevision,
      content: finalContent,
    };
  }

  /**
   * Regenerate spec with clarifying answers
   */
  async regenerateWithAnswers(
    specRevId: string,
    answers: { questionNumber: number; question: string; answer: string }[]
  ): Promise<SpecRevisionData> {
    const specRev = await db.specRevision.findUnique({
      where: { id: specRevId },
      include: {
        feature: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!specRev) {
      throw new Error('Spec revision not found');
    }

    // Save answers to database
    for (const answer of answers) {
      await db.clarifyingAnswer.upsert({
        where: {
          specRevId_questionNumber: {
            specRevId,
            questionNumber: answer.questionNumber,
          },
        },
        create: {
          specRevId,
          questionNumber: answer.questionNumber,
          question: answer.question,
          answer: answer.answer,
        },
        update: {
          answer: answer.answer,
        },
      });
    }

    // Get the original spec content (you'll need to retrieve this from somewhere)
    // For now, we'll regenerate from scratch with answers included

    const feature = specRev.feature;
    const answerContext = answers
      .map(
        (a) => `**Q${a.questionNumber}**: ${a.question}\n**A**: ${a.answer}`
      )
      .join('\n\n');

    const prompt = `Based on the following feature description and clarifying answers, generate a complete, detailed specification.

Feature: ${feature.title}
Description: ${feature.description}

Clarifying Answers:
${answerContext}

Generate a comprehensive specification with the following sections:
1. User Scenarios (with specific user stories and acceptance criteria)
2. Functional Requirements (detailed, testable requirements)
3. Success Criteria (measurable outcomes)
4. Assumptions and Constraints

Be specific and thorough. Use the clarifying answers to resolve any ambiguities.`;

    const generatedContent = await llmGateway.callProvider(
      prompt,
      undefined,
      feature.project.orgId
    );

    // Update spec revision
    // Note: In a real implementation, you'd store the content in a separate table or field

    return {
      ...specRev,
      content: generatedContent,
    };
  }

  /**
   * Lock a spec revision (after handoff)
   */
  async lockSpecRevision(specRevId: string): Promise<void> {
    await db.specRevision.update({
      where: { id: specRevId },
      data: {
        isActive: false,
        status: 'HANDED_OFF',
      },
    });
  }

  /**
   * Check if a spec can be edited
   */
  async canEditSpec(specRevId: string): Promise<boolean> {
    const specRev = await db.specRevision.findUnique({
      where: { id: specRevId },
      include: {
        feature: true,
      },
    });

    if (!specRev) {
      return false;
    }

    return (
      specRev.isActive &&
      specRev.status !== 'HANDED_OFF' &&
      specRev.feature.status !== 'HANDED_OFF'
    );
  }

  /**
   * Build a prompt for spec generation
   */
  private buildGenerationPrompt(
    featureTitle: string,
    featureDescription: string,
    projectName: string,
    templateContent: string
  ): string {
    // Check if template has remaining placeholders
    const hasPlaceholders = /\{\{[A-Z_0-9]+\}\}/.test(templateContent);

    if (hasPlaceholders) {
      // Template has placeholders - instruct LLM to fill them
      return `You are a business analyst creating a software specification.

Project: ${projectName}
Feature: ${featureTitle}
Description: ${featureDescription}

I have a specification template with placeholders marked as {{PLACEHOLDER_NAME}}. Your task is to:
1. Replace ALL remaining placeholders with appropriate, detailed content
2. Generate specific, realistic examples (not generic placeholders)
3. Keep the template structure intact
4. Write in clear, non-technical language for business stakeholders

Template to complete:
${templateContent}

Instructions:
- For user roles/personas, create realistic, specific personas relevant to this feature
- For requirements (FR1, FR2, etc.), write detailed, testable requirements using MUST/SHOULD/MAY
- For acceptance criteria, write specific Given-When-Then scenarios
- For success metrics, include concrete, measurable numbers
- For data requirements, specify actual fields and validation rules
- Do NOT leave any {{PLACEHOLDER}} unfilled - replace each with real content

Generate the complete specification now with all placeholders filled:`;
    } else {
      // Template is plain structure without placeholders
      return `You are a business analyst creating a software specification.

Project: ${projectName}
Feature: ${featureTitle}
Description: ${featureDescription}

Generate a comprehensive specification following this template structure:
${templateContent}

Guidelines:
1. Clear user scenarios with specific personas and problems they're solving
2. Detailed, testable functional requirements (use "MUST", "SHOULD", "MAY")
3. Measurable success criteria (include concrete metrics)
4. Realistic assumptions and clearly defined constraints  
5. Edge cases and error handling scenarios

Write in clear, non-technical language suitable for business stakeholders. Avoid mentioning specific technologies, frameworks, or implementation details. Focus on WHAT needs to be built, not HOW.

Generate the complete specification now:`;
    }
  }

  /**
   * Merge generated content with template structure
   * @deprecated - No longer used as LLM generates complete spec
   */
  private mergeGeneratedContent(
    template: string,
    generated: string
  ): string {
    // LLM now generates the complete spec, so just return it
    return generated;
  }
}

export const specService = new SpecService();

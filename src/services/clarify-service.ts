import { llmGateway } from '@/services/llm-gateway';
import { db } from '@/lib/db';

export interface ClarifyingQuestion {
  questionNumber: number;
  question: string;
  options?: string[];
  type: 'radio' | 'checkbox' | 'text';
}

export interface ClarifyingAnswer {
  questionNumber: number;
  question: string;
  answer: string;
}

export class ClarifyService {
  /**
   * Generate clarifying questions for a spec
   */
  async identifyClarifyingQuestions(
    specContent: string,
    orgId: string
  ): Promise<ClarifyingQuestion[]> {
    const prompt = `You are helping refine a software specification. Review the following specification and identify 3 KEY ambiguities or critical decisions that need clarification.

For each ambiguity, generate a question that will make the specification more precise and actionable.

Specification:
${specContent}

Generate exactly 3 clarifying questions. For each question:
1. Focus on ambiguities that could lead to different implementations
2. Ask about specific use cases, edge cases, or business rules
3. Make questions specific and answerable

Format your response as a JSON array with this structure:
[
  {
    "questionNumber": 1,
    "question": "What should happen when...",
    "type": "text"
  },
  {
    "questionNumber": 2,
    "question": "Should the system support...",
    "type": "radio",
    "options": ["Yes", "No", "Future Enhancement"]
  },
  {
    "questionNumber": 3,
    "question": "Which of the following...",
    "type": "checkbox",
    "options": ["Option A", "Option B", "Option C"]
  }
]

Guidelines:
- Use "text" type for open-ended questions requiring explanation
- Use "radio" type for single-choice decisions
- Use "checkbox" type for multi-select options
- Limit to 3 questions maximum
- Each question should clarify a distinct aspect

Generate the JSON now:`;

    const response = await llmGateway.callProvider(prompt, undefined, orgId);

    // Parse the LLM response as JSON
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;

      const questions = JSON.parse(jsonStr) as ClarifyingQuestion[];

      // Validate the structure
      if (!Array.isArray(questions) || questions.length === 0 || questions.length > 3) {
        throw new Error('Invalid number of questions');
      }

      return questions;
    } catch (error) {
      console.error('Failed to parse clarifying questions:', error);
      // Return default questions if parsing fails
      return [
        {
          questionNumber: 1,
          question:
            'What are the primary success metrics for this feature?',
          type: 'text',
        },
        {
          questionNumber: 2,
          question:
            'Who are the primary users of this feature and what problems are they trying to solve?',
          type: 'text',
        },
        {
          questionNumber: 3,
          question:
            'Are there any specific edge cases or error scenarios we should handle?',
          type: 'text',
        },
      ];
    }
  }

  /**
   * Save clarifying answers and regenerate spec
   */
  async saveAnswersAndRegenerate(
    specRevId: string,
    answers: ClarifyingAnswer[]
  ): Promise<{ updatedContent: string }> {
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

    // Regenerate spec with answers
    const feature = specRev.feature;
    const answerContext = answers
      .map(
        (a) => `**Q${a.questionNumber}**: ${a.question}\n**A**: ${a.answer}`
      )
      .join('\n\n');

    const prompt = `You are refining a software specification based on clarifying answers.

Feature: ${feature.title}
Description: ${feature.description}

Clarifying Questions and Answers:
${answerContext}

Please generate an UPDATED and ENHANCED specification that incorporates these clarifying answers. The specification should include:

1. **User Scenarios** - Updated with specific details from the answers
2. **Functional Requirements** - More precise requirements based on the clarifications
3. **Success Criteria** - Measurable outcomes aligned with the answers
4. **Assumptions and Constraints** - Include any constraints revealed by the answers

Focus on:
- Incorporating the clarifying answers directly into the appropriate sections
- Resolving ambiguities with specific details
- Making requirements more testable and actionable
- Maintaining clear, business-focused language

Generate the complete, refined specification now:`;

    const updatedContent = await llmGateway.callProvider(
      prompt,
      undefined,
      feature.project.orgId
    );

    return { updatedContent };
  }

  /**
   * Get all answers for a spec revision
   */
  async getAnswers(specRevId: string): Promise<ClarifyingAnswer[]> {
    const answers = await db.clarifyingAnswer.findMany({
      where: { specRevId },
      orderBy: { questionNumber: 'asc' },
    });

    return answers.map((a) => ({
      questionNumber: a.questionNumber,
      question: a.question,
      answer: a.answer,
    }));
  }
}

export const clarifyService = new ClarifyService();

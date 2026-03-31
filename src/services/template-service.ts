import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface SpecTemplate {
  id: string;
  orgId: string;
  name: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateService {
  /**
   * Get the active template for an organization
   * Falls back to default template if no custom template is set
   */
  async getActiveTemplate(orgId: string): Promise<SpecTemplate | null> {
    // First, try to get the default template for this org
    const customTemplate = await db.specTemplate.findFirst({
      where: {
        orgId,
        isDefault: true,
        isActive: true,
      },
    });

    if (customTemplate) {
      return customTemplate;
    }

    // Fallback to the built-in default template
    const defaultContent = await this.getDefaultTemplateContent();
    return {
      id: 'default',
      orgId,
      name: 'Default Spec Template',
      content: defaultContent,
      isDefault: true,
      isActive: true,
      uploadedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get all templates for an organization
   */
  async getTemplates(orgId: string): Promise<SpecTemplate[]> {
    const templates = await db.specTemplate.findMany({
      where: {
        orgId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add the default template as an option
    const defaultContent = await this.getDefaultTemplateContent();
    return [
      {
        id: 'default',
        orgId,
        name: 'Default Spec Template (Built-in)',
        content: defaultContent,
        isDefault: false,
        isActive: true,
        uploadedBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ...templates,
    ];
  }

  /**
   * Create a new template
   */
  async createTemplate(
    orgId: string,
    name: string,
    content: string,
    uploadedBy: string,
    setAsDefault: boolean = false
  ): Promise<SpecTemplate> {
    // Validate template has required sections
    this.validateTemplate(content);

    // If setting as default, unset previous default
    if (setAsDefault) {
      await db.specTemplate.updateMany({
        where: {
          orgId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await db.specTemplate.create({
      data: {
        orgId,
        name,
        content,
        isDefault: setAsDefault,
        isActive: true,
        uploadedBy,
      },
    });

    return template;
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    updates: {
      name?: string;
      content?: string;
      isDefault?: boolean;
    }
  ): Promise<SpecTemplate> {
    if (updates.content) {
      this.validateTemplate(updates.content);
    }

    const template = await db.specTemplate.update({
      where: { id: templateId },
      data: updates,
    });

    // If setting as default, unset others
    if (updates.isDefault) {
      await db.specTemplate.updateMany({
        where: {
          orgId: template.orgId,
          id: { not: templateId },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return template;
  }

  /**
   * Delete (deactivate) a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const template = await db.specTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.isDefault) {
      throw new Error('Cannot delete the default template');
    }

    await db.specTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });
  }

  /**
   * Validate template has required sections
   */
  private validateTemplate(content: string): void {
    const requiredSections = [
      'User Scenarios',
      'Functional Requirements',
      'Success Criteria',
      'Assumptions',
    ];

    const missingSection = requiredSections.find(
      (section) => !content.includes(section)
    );

    if (missingSection) {
      throw new Error(
        `Template validation failed: Missing required section "${missingSection}"`
      );
    }
  }

  /**
   * Read the default template content from file
   */
  private async getDefaultTemplateContent(): Promise<string> {
    const templatePath = join(
      process.cwd(),
      'src',
      'lib',
      'DEFAULT_SPEC_TEMPLATE.md'
    );
    return await readFile(templatePath, 'utf-8');
  }

  /**
   * Fill template placeholders with actual values
   */
  fillTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    let filled = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      filled = filled.replaceAll(placeholder, value);
    }

    return filled;
  }
}

export const templateService = new TemplateService();

'use client';

interface SpecTemplate {
  id: string;
  name: string;
  isDefault: boolean;
}

interface TemplateSelectorProps {
  templates: SpecTemplate[];
  selectedTemplateId?: string;
  onSelect: (templateId: string) => void;
  disabled?: boolean;
}

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
  disabled = false,
}: TemplateSelectorProps) {
  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">Select Template</h3>
      <div className="space-y-2">
        {templates.map((template) => (
          <label
            key={template.id}
            className={`
              flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors
              ${
                selectedTemplateId === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="template"
              value={template.id}
              checked={selectedTemplateId === template.id}
              onChange={() => !disabled && onSelect(template.id)}
              disabled={disabled}
              className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {template.name}
                </span>
                {template.isDefault && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    Default
                  </span>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Star, AlertCircle, FileText, Check } from 'lucide-react';
import { format } from 'date-fns';

interface SpecTemplate {
  id: string;
  orgId: string;
  name: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionPayload {
  userId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  orgId: string | null;
  orgRole?: 'owner' | 'admin' | 'member';
}

export default function TemplatesSettingsPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check if user is admin
  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/user');
      if (!res.ok) throw new Error('Failed to fetch user');
      const json = await res.json();
      return json.data as SessionPayload;
    },
  });

  const isAdmin = sessionData?.orgRole === 'owner' || sessionData?.orgRole === 'admin';

  // Fetch templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const json = await res.json();
      return json.data as SpecTemplate[];
    },
    enabled: isAdmin,
  });

  // Upload template mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          content: templateContent,
          setAsDefault,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload template');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowUploadForm(false);
      setTemplateName('');
      setTemplateContent('');
      setSetAsDefault(false);
      setUploadError(null);
    },
    onError: (error: Error) => {
      setUploadError(error.message);
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to set default template');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleUpload = () => {
    if (!templateName.trim() || !templateContent.trim()) {
      setUploadError('Template name and content are required');
      return;
    }
    uploadMutation.mutate();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTemplateContent(content);
      if (!templateName) {
        setTemplateName(file.name.replace(/\.(md|markdown)$/i, ''));
      }
    };
    reader.readAsText(file);
  };

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Access Denied
              </h2>
              <p className="text-red-700">
                You must be an organization owner or admin to manage spec templates.
                Please contact your organization administrator for access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Spec Templates</h1>
          <p className="text-muted-foreground">
            Manage custom Markdown templates for AI-generated specifications.
            Templates define the structure and sections for new specs.
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {showUploadForm ? 'Cancel' : 'Upload Template'}
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="border rounded-lg p-6 space-y-4 bg-accent/50">
          <h2 className="text-xl font-semibold">Upload New Template</h2>

          {uploadError && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50 text-red-700">
              {uploadError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Enterprise Spec Template"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Markdown File
            </label>
            <input
              type="file"
              accept=".md,.markdown"
              onChange={handleFileUpload}
              className="w-full"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Upload a .md or .markdown file. Required sections: User Scenarios, Functional Requirements, Success Criteria, Assumptions.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Template Content (Markdown)
            </label>
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              placeholder="# {{FEATURE_TITLE}}&#10;&#10;## User Scenarios&#10;&#10;## Functional Requirements&#10;..."
              rows={12}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use placeholders: {'{{FEATURE_TITLE}}'}, {'{{PROJECT_NAME}}'}, {'{{FEATURE_DESCRIPTION}}'}, {'{{CREATED_DATE}}'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="setAsDefault"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="setAsDefault" className="text-sm font-medium">
              Set as default template for new features
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              {uploadMutation.isPending ? 'Uploading...' : 'Save Template'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadForm(false);
                setUploadError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Templates</h2>

        {isLoadingTemplates ? (
          <p className="text-muted-foreground">Loading templates...</p>
        ) : templates && templates.length > 0 ? (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      {template.isDefault && (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Default
                        </span>
                      )}
                      {template.id === 'default' && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                          Built-in
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Uploaded by {template.uploadedBy} on{' '}
                      {format(new Date(template.createdAt), 'MMM d, yyyy')}
                    </p>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-primary hover:underline">
                        View template content
                      </summary>
                      <pre className="mt-3 rounded-md bg-muted p-4 text-xs overflow-x-auto max-h-96 overflow-y-auto">
                        {template.content.slice(0, 1000)}
                        {template.content.length > 1000 && '...\n\n[Content truncated]'}
                      </pre>
                    </details>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {!template.isDefault && template.id !== 'default' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDefaultMutation.mutate(template.id)}
                        disabled={setDefaultMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Star className="h-3 w-3" />
                        Set Default
                      </Button>
                    )}
                    {template.id !== 'default' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Delete template "${template.name}"?`)) {
                            deleteMutation.mutate(template.id);
                          }
                        }}
                        disabled={deleteMutation.isPending || template.isDefault}
                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              No custom templates yet. Upload your first template to get started.
            </p>
            <Button onClick={() => setShowUploadForm(true)}>
              Upload Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

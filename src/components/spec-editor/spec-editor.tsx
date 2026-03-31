'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClarifyingQuestions } from '@/components/spec-editor/clarifying-questions';
import { SyncResultDisplay } from '@/components/github-status/sync-result';

interface SpecRevision {
  id: string;
  featureId: string;
  revNumber: number;
  branchName: string;
  status: string;
  content?: string;
  createdAt: string;
}

interface SpecTemplate {
  id: string;
  name: string;
  isDefault: boolean;
}

interface SpecEditorProps {
  featureId: string;
}

export function SpecEditor({ featureId }: SpecEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClarify, setShowClarify] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch current spec
  const { data: specData, isLoading: isLoadingSpec } = useQuery({
    queryKey: ['spec', featureId],
    queryFn: async () => {
      const res = await fetch(`/api/specs/generate?featureId=${featureId}`);
      if (!res.ok) {
        if (res.status === 404) return null; // No spec yet
        throw new Error('Failed to fetch spec');
      }
      const json = await res.json();
      return json.data as SpecRevision;
    },
  });

  // Fetch available templates
  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const json = await res.json();
      return json.data as SpecTemplate[];
    },
  });

  // Generate spec mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/specs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId,
          templateId: selectedTemplate,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate spec');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec', featureId] });
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Generation error:', error);
      setIsGenerating(false);
    },
  });

  // Handoff mutation
  const handoffMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/features/${featureId}/handoff`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to hand off spec');
      }

      return res.json();
    },
    onSuccess: (data) => {
      setSyncResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['spec', featureId] });
    },
  });

  const handleGenerateSpec = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  if (isLoadingSpec) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading specification...</div>
      </div>
    );
  }

  // No spec exists yet - show generation UI
  if (!specData) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold">Generate Specification</h2>
          <p className="text-muted-foreground mt-2">
            Use AI to automatically generate a structured specification from your feature description.
          </p>
        </div>

        {templatesData && templatesData.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Template</label>
            <div className="space-y-2">
              {templatesData.map((template) => (
                <label
                  key={template.id}
                  className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="font-medium">{template.name}</div>
                    {template.isDefault && (
                      <span className="text-xs text-muted-foreground">(Default)</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerateSpec}
          disabled={isGenerating || generateMutation.isPending}
          size="lg"
        >
          {isGenerating || generateMutation.isPending
            ? 'Generating...'
            : 'Generate Specification'}
        </Button>

        {generateMutation.isError && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">
              {generateMutation.error.message}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show clarifying questions if requested
  if (showClarify && specData) {
    return (
      <ClarifyingQuestions
        specRevId={specData.id}
        onComplete={() => {
          setShowClarify(false);
          queryClient.invalidateQueries({ queryKey: ['spec', featureId] });
        }}
        onSkip={() => setShowClarify(false)}
      />
    );
  }

  // Spec exists - show editor
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Preview Section */}
      <div className="border rounded-lg p-6 overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Preview</h3>
          <span className="text-xs text-muted-foreground">
            Revision {specData.revNumber} • {specData.status}
          </span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {specData.content ? (
            <div dangerouslySetInnerHTML={{ __html: specData.content }} />
          ) : (
            <p className="text-muted-foreground">No content available</p>
          )}
        </div>
      </div>

      {/* Editor Section */}
      <div className="border rounded-lg p-6 overflow-auto space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full">
              Edit Specification
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowClarify(true)}
            >
              Answer Clarifying Questions
            </Button>
            <Button variant="default" className="w-full">
              Request Approval
            </Button>
            <Button
              variant="default"
              className="w-full"
              onClick={() => handoffMutation.mutate()}
              disabled={handoffMutation.isPending || specData.status === 'HANDED_OFF'}
            >
              {handoffMutation.isPending ? 'Handing Off...' : 'Hand Off to GitHub'}
            </Button>
          </div>

          {handoffMutation.isError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
              {handoffMutation.error.message}
            </div>
          )}
        </div>

        {/* Sync Results */}
        {syncResult && (
          <div className="pt-4 border-t">
            <SyncResultDisplay results={syncResult} />
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-2">Spec Details</h4>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium">Branch Name</dt>
              <dd className="text-muted-foreground font-mono text-xs mt-1">
                {specData.branchName}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Created</dt>
              <dd className="text-muted-foreground">
                {new Date(specData.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}


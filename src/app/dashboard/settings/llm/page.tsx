'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LLMKey {
  id: string;
  provider: string;
  authType: string;
  maskedKey: string;
  isDefault: boolean;
  createdAt: string;
}

interface Provider {
  value: string;
  label: string;
  authType: 'api_key' | 'oauth';
  placeholder?: string;
  description: string;
}

interface SessionPayload {
  userId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  orgId: string | null;
  orgRole?: 'owner' | 'admin' | 'member';
}

export default function LLMSettingsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(true);
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

  // Fetch existing keys
  const { data, isLoading } = useQuery({
    queryKey: ['llm-keys'],
    queryFn: async () => {
      const res = await fetch('/api/llm/keys');
      if (!res.ok) throw new Error('Failed to fetch keys');
      const json = await res.json();
      return json.data as { keys: LLMKey[]; defaultProvider: string | null };
    },
    enabled: isAdmin, // Only fetch if admin
  });

  // Show loading state
  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show access denied if not admin
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
                You must be an organization owner or admin to configure LLM API keys.
                Please contact your organization administrator for access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Save key mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/llm/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey,
          setAsDefault,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save key');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-keys'] });
      setApiKey('');
      setShowKey(false);
    },
  });

  const handleSave = () => {
    if (selectedProviderInfo?.authType === 'oauth') {
      // Redirect to OAuth authorization
      window.location.href = `/api/llm/oauth/${selectedProvider}/authorize`;
    } else {
      if (!apiKey.trim()) return;
      saveMutation.mutate();
    }
  };

  const providers: Provider[] = [
    { value: 'openai', label: 'OpenAI', authType: 'api_key', placeholder: 'sk-...', description: 'GPT-4, GPT-3.5-Turbo' },
    { value: 'anthropic', label: 'Anthropic', authType: 'api_key', placeholder: 'sk-ant-...', description: 'Claude-3 models' },
    { value: 'google_ai', label: 'Google AI', authType: 'api_key', placeholder: 'AIza...', description: 'Gemini models' },
    { value: 'github_copilot', label: 'GitHub Copilot', authType: 'oauth', description: 'GitHub Models via OAuth' },
  ];

  const selectedProviderInfo = providers.find((p) => p.value === selectedProvider);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">LLM Provider Configuration</h1>
        <p className="text-muted-foreground">
          Configure your API keys for AI-powered specification generation. Keys are encrypted and stored securely.
        </p>
      </div>

      {/* Add/Update Key Form */}
      <div className="border rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Add or Update API Key</h2>
        </div>

        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Provider</label>
            <div className="grid grid-cols-2 gap-3">
              {providers.map((provider) => (
                <label
                  key={provider.value}
                  className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                >
                  <input
                    type="radio"
                    name="provider"
                    value={provider.value}
                    checked={selectedProvider === provider.value}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.label}</span>
                      {provider.authType === 'oauth' && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
                          OAuth
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* API Key Input (only for non-OAuth) */}
          {selectedProviderInfo?.authType === 'api_key' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                API Key
                <Lock className="inline h-3 w-3 ml-1" />
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={selectedProviderInfo.placeholder}
                  className="w-full p-3 border rounded-lg pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your API key is encrypted before storage and never exposed to the browser.
              </p>
            </div>
          )}

          {/* OAuth Info */}
          {selectedProviderInfo?.authType === 'oauth' && (
            <div className="rounded-md bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                Click &ldquo;Connect&rdquo; to authenticate with {selectedProviderInfo.label} via OAuth. You&apos;ll be redirected to authorize access.
              </p>
            </div>
          )}

          {/* Set as Default */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">Set as default provider for this organization</span>
            </label>
          </div>

          {/* Save/Connect Button */}
          <Button
            onClick={handleSave}
            disabled={(selectedProviderInfo?.authType === 'api_key' && !apiKey.trim()) || saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? 'Saving...' : selectedProviderInfo?.authType === 'oauth' ? 'Connect with OAuth' : 'Save API Key'}
          </Button>

          {saveMutation.isError && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
              {saveMutation.error.message}
            </div>
          )}

          {saveMutation.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              API key saved successfully!
            </div>
          )}
        </div>
      </div>

      {/* Configured Keys */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Configured Providers</h2>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : data && data.keys.length > 0 ? (
          <div className="space-y-3">
            {data.keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium capitalize">{key.provider.replace('_', ' ')}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {key.authType === 'oauth' ? 'OAuth Token' : `Key: ${key.maskedKey}`}
                  </p>
                  {key.isDefault && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Updated {new Date(key.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No API keys configured yet.</p>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🔒 Security & Privacy</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All API keys are encrypted using AES-256-GCM before storage</li>
          <li>• Keys are only decrypt ed server-side for LLM API calls</li>
          <li>• Keys are never logged, exposed to the browser, or shared between organizations</li>
          <li>• Only organization admins can view or modify API keys</li>
        </ul>
      </div>
    </div>
  );
}

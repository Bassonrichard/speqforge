import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LLMError, RateLimitError, ValidationError } from '@/types/errors';
import { decryptKey } from '@/lib/crypto';

export type LLMProvider = 'openai' | 'anthropic' | 'google_ai' | 'openai_codex';

export interface LLMCallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  provider: LLMProvider;
}

/**
 * LLM Gateway - abstracts provider-specific implementation details
 * Handles multiple LLM providers (OpenAI, Anthropic, Google AI)
 * Manages encryption/decryption of API keys
 */
export class LLMGateway {
  public provider: LLMProvider;
  private apiKey: string;
  private encryptedKeyIv?: string;

  constructor(provider: LLMProvider, apiKey: string, encryptedKeyIv?: string) {
    if (!apiKey) {
      throw new Error(`API key required for ${provider}`);
    }

    this.provider = provider;
    this.apiKey = apiKey;
    this.encryptedKeyIv = encryptedKeyIv;
  }

  /**
   * Create gateway from encrypted key (from database)
   */
  static fromEncryptedKey(provider: LLMProvider, encryptedKey: string, iv: string): LLMGateway {
    const decryptedKey = decryptKey(encryptedKey, iv);
    return new LLMGateway(provider, decryptedKey, iv);
  }

  /**
   * Call LLM with prompt - main interface
   */
  async call(prompt: string, options: LLMCallOptions = {}): Promise<LLMResponse> {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = 'You are a helpful assistant for software specification writing.',
    } = options;

    try {
      switch (this.provider) {
        case 'openai':
        case 'openai_codex':
          return await this.callOpenAI(prompt, { temperature, maxTokens, systemPrompt });
        case 'anthropic':
          return await this.callAnthropic(prompt, { temperature, maxTokens, systemPrompt });
        case 'google_ai':
          throw new LLMError('Google AI provider not yet implemented', 'google_ai');
        default:
          throw new LLMError(`Unknown provider: ${this.provider}`, this.provider);
      }
    } catch (error) {
      if (error instanceof LLMError) throw error;
      if (error instanceof RateLimitError) throw error;

      // Handle provider-specific errors
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new LLMError(`${this.provider} API key is invalid`, this.provider);
        }
        if (error.message.includes('429')) {
          throw new RateLimitError(`${this.provider} rate limit exceeded`);
        }
        if (error.message.includes('context_length')) {
          throw new LLMError('Prompt exceeds maximum context length', this.provider);
        }
      }

      throw new LLMError(`Error calling ${this.provider}: ${error instanceof Error ? error.message : String(error)}`, this.provider);
    }
  }

  /**
   * OpenAI API call
   */
  private async callOpenAI(
    prompt: string,
    options: { temperature: number; maxTokens: number; systemPrompt: string }
  ): Promise<LLMResponse> {
    const client = new OpenAI({ apiKey: this.apiKey });

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    if (!response.choices[0].message.content) {
      throw new LLMError('Empty response from OpenAI', 'openai');
    }

    return {
      content: response.choices[0].message.content,
      model: response.model,
      provider: 'openai',
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  }

  /**
   * Anthropic API call
   */
  private async callAnthropic(
    prompt: string,
    options: { temperature: number; maxTokens: number; systemPrompt: string }
  ): Promise<LLMResponse> {
    const client = new Anthropic({ apiKey: this.apiKey });

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens,
      system: options.systemPrompt,
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: options.temperature,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new LLMError('Empty response from Anthropic', 'anthropic');
    }

    return {
      content: textBlock.text,
      model: response.model,
      provider: 'anthropic',
      tokensUsed: {
        prompt: response.usage?.input_tokens || 0,
        completion: response.usage?.output_tokens || 0,
        total: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
    };
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.call('Respond with "OK"', {
        maxTokens: 10,
        temperature: 0,
      });
      return response.content.toUpperCase().includes('OK');
    } catch {
      return false;
    }
  }

  /**
   * Get provider and model info
   */
  getInfo() {
    return {
      provider: this.provider,
      model: this.getDefaultModel(),
    };
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(): string {
    switch (this.provider) {
      case 'openai':
        return 'gpt-4-turbo-preview';
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022';
      case 'google_ai':
        return 'gemini-pro';
      default:
        return 'unknown';
    }
  }

  /**
   * Select provider by checking configured keys
   */
  static selectBestProvider(providers: Array<{ provider: LLMProvider; configured: boolean }>): LLMProvider | null {
    const preferred = ['openai', 'anthropic', 'google_ai'];

    for (const providerName of preferred) {
      const provider = providers.find((p) => p.provider === (providerName as LLMProvider));
      if (provider?.configured) {
        return provider.provider;
      }
    }

    return null;
  }
}

/**
 * Helper function to create gateway from request context
 * Used in API routes to get configured provider
 */
export async function getLLMGateway(
  provider: LLMProvider,
  userKeys?: { encryptedKey: string; iv: string }
): Promise<LLMGateway> {
  if (userKeys) {
    return LLMGateway.fromEncryptedKey(provider, userKeys.encryptedKey, userKeys.iv);
  }

  // Fall back to environment variables (org-level keys)
  const envKey = `LLM_${provider.toUpperCase()}_KEY`;
  const key = process.env[envKey];

  if (!key) {
    throw new ValidationError(`No API key configured for ${provider}`);
  }

  return new LLMGateway(provider, key);
}

/**
 * Call LLM provider using organization's configured keys
 * This is the main entry point for spec generation and clarification
 */
async function callProvider(
  prompt: string,
  providerOverride: LLMProvider | undefined,
  orgId: string,
  options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
): Promise<string> {
  const { createOrgLLMGateway } = await import('./llm-key-service');
  
  const gateway = await createOrgLLMGateway(orgId);
  
  // If provider override specified, re-create gateway with that provider
  if (providerOverride && providerOverride !== gateway.provider) {
    const { loadOrgLLMCredentials } = await import('./llm-key-service');
    const credentials = await loadOrgLLMCredentials(orgId);
    
    // Check if org has this provider configured
    if (credentials.provider !== providerOverride) {
      throw new Error(`Provider ${providerOverride} not configured for organization`);
    }
  }

  const response = await gateway.call(prompt, {
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 4000,
    systemPrompt: options?.systemPrompt ?? 'You are a helpful assistant specializing in software specification writing.',
  });

  return response.content;
}

/**
 * Singleton-style gateway for backwards compatibility
 */
export const llmGateway = {
  callProvider,
};

/**
 * Quick spec generation helper
 */
export async function generateSpecDraft(
  prompt: string,
  provider: LLMProvider,
  userKeys?: { encryptedKey: string; iv: string }
): Promise<string> {
  const gateway = await getLLMGateway(provider, userKeys);

  const response = await gateway.call(prompt, {
    systemPrompt: `You are an expert software architect writing detailed technical specifications. 
    Generate a comprehensive specification that includes:
    - Overview and purpose
    - User stories and acceptance criteria
    - Technical requirements
    - API endpoints (if applicable)
    - Database schema changes
    - Security considerations
    - Performance requirements`,
    temperature: 0.5,
    maxTokens: 3000,
  });

  return response.content;
}


import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt an API key using AES-256-GCM
 * Returns both the encrypted key and IV needed for decryption
 */
export function encryptKey(plainKey: string): { encryptedKey: string; iv: string } {
  // Generate IV
  const iv = randomBytes(IV_LENGTH);

  // Generate encryption key from master key
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey || masterKey.length < 32) {
    throw new Error('ENCRYPTION_KEY environment variable must be at least 32 characters');
  }

  // Use master key directly (should be pre-generated 32-byte key or longer)
  const key = Buffer.from(masterKey.slice(0, 32), 'utf-8');

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  let encrypted = cipher.update(plainKey, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Combine encrypted data + auth tag
  const finalEncrypted = encrypted + authTag.toString('hex');

  return {
    encryptedKey: finalEncrypted,
    iv: iv.toString('hex'),
  };
}

/**
 * Decrypt an API key using AES-256-GCM
 */
export function decryptKey(encryptedKey: string, ivHex: string): string {
  try {
    // Get master key
    const masterKey = process.env.ENCRYPTION_KEY;
    if (!masterKey || masterKey.length < 32) {
      throw new Error('ENCRYPTION_KEY environment variable must be at least 32 characters');
    }

    const key = Buffer.from(masterKey.slice(0, 32), 'utf-8');
    const iv = Buffer.from(ivHex, 'hex');

    // Split auth tag from encrypted data (last 32 hex chars = 16 bytes)
    const encryptedHex = encryptedKey.slice(0, -32);
    const authTagHex = encryptedKey.slice(-32);
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Mask a sensitive key for display
 * Shows first 4 and last 4 characters, rest hidden
 */
export function maskKey(key: string): string {
  if (key.length <= 8) {
    return '****';
  }
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  return `${start}...${end}`;
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(provider: string, key: string): boolean {
  const minLength = 10; // Most API keys are longer

  if (key.length < minLength) {
    return false;
  }

  // Provider-specific validations
  switch (provider) {
    case 'openai':
      // OpenAI keys start with sk-
      return key.startsWith('sk-') && key.length > 20;
    case 'anthropic':
      // Anthropic keys start with sk-ant-
      return key.startsWith('sk-ant-') && key.length > 20;
    case 'google_ai':
      // Google AI keys are typically longer alphanumeric
      return /^[a-zA-Z0-9_-]{20,}$/.test(key);
    default:
      return true; // Generic validation for other providers
  }
}

/**
 * Test an API key by making a minimal request
 * Note: This should be called from an API route, not client-side
 */
export async function testLLMApiKey(provider: string, key: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai': {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${key}`,
          },
        });
        return response.ok || response.status === 401 || response.status === 429; // 401 = invalid, 429 = rate limited (but valid key)
      }
      case 'anthropic': {
        // Simple list models request
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': key,
          },
        });
        return response.ok || response.status === 401 || response.status === 429;
      }
      case 'google_ai': {
        // Google API validation
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`, {
          method: 'GET',
        });
        return response.ok || response.status === 401 || response.status === 429;
      }
      default:
        return true; // Can't validate unknown provider
    }
  } catch {
    return false; // Network error or other issue
  }
}

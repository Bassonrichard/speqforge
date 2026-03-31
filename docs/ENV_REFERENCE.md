# Environment Variables Quick Reference

## Visual Mapping: GitHub App → .env.local

This shows exactly where each value comes from in the GitHub App settings and where it goes in your `.env.local` file.

### GitHub App Settings Page 
**URL:** https://github.com/settings/apps/your-app-name

```
┌─────────────────────────────────────────────────────────────┐
│  About Section                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  App ID: 123456                                            │
│  └─→ GITHUB_APP_ID=123456                                  │
│                                                             │
│  Client ID: Iv2.abc123def456789                            │
│  └─→ NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv2.abc123def456789      │
│                                                             │
│  ┌─ Client Secret ─────────────────────────────────────┐  │
│  │ Generate a new client secret                        │  │
│  │ ⬇ [Click this button]                              │  │
│  │ secret_abc123def456...                              │  │
│  │ └─→ GITHUB_OAUTH_CLIENT_SECRET=secret_abc123...     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Private Keys Section (scroll down)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Private Key ───────────────────────────────────────┐  │
│  │ Generate a private key                              │  │
│  │ ⬇ [Click this button]                              │  │
│  │ Downloads: speqforge.private-key.pem                │  │
│  │                                                     │  │
│  │ -----BEGIN RSA PRIVATE KEY-----                     │  │
│  │ MIIEpAIBAAKCAQEA2a2j...                             │  │
│  │ ...                                                 │  │
│  │ -----END RSA PRIVATE KEY-----                       │  │
│  │ └─→ GITHUB_APP_PRIVATE_KEY=[entire PEM contents]   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Webhook Section (optional for dev)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Webhook Secret:                                           │
│  [secret_abc123...]                                        │
│  └─→ GITHUB_APP_WEBHOOK_SECRET=secret_abc123...           │
│                                                             │
│  OR generate new one:                                      │
│  $ openssl rand -hex 32                                    │
│  abc123def456...                                           │
│  └─→ GITHUB_APP_WEBHOOK_SECRET=abc123def456...            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## .env.local File

Create or update `.env.local` in your project root:

```bash
# From GitHub App settings:
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2a2j4/6vL...
...
-----END RSA PRIVATE KEY-----
GITHUB_APP_WEBHOOK_SECRET=abc123def456...
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv2.abc123def456789
GITHUB_OAUTH_CLIENT_SECRET=secret_abc123def456...

# OpenAI OAuth (for Codex BYOK - optional):
OPENAI_OAUTH_CLIENT_ID=your_openai_client_id
OPENAI_OAUTH_CLIENT_SECRET=your_openai_client_secret

# Auto-generated (you already have these):
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=be33a3342959d8cd16cb66fe489e1be6a1c30c20c18f3bbf0c07fe5a682c91f9
ENCRYPTION_KEY=32d330520fb901bc678eec0025b680b35253e28e335952ca78fbfa0922d09723
DATABASE_URL=file:./dev.db
```

## Field Validation

| Field | Example | Rules |
|-------|---------|-------|
| `GITHUB_APP_ID` | `123456` | Numbers only, no quotes needed |
| `GITHUB_APP_PRIVATE_KEY` | `-----BEGIN RSA...` | Multi-line, keep leading/trailing dashes |
| `GITHUB_APP_WEBHOOK_SECRET` | `abc123def456...` | Hex string (0-9, a-f), 64 chars |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | `Iv2.abc123...` | Starts with `Iv2.`, no quotes needed |
| `GITHUB_OAUTH_CLIENT_SECRET` | `ghs_abc123...` or `secret_abc...` | Must be non-empty, no quotes |
| `OPENAI_OAUTH_CLIENT_ID` | `your_client_id` | Optional, for Codex OAuth |
| `OPENAI_OAUTH_CLIENT_SECRET` | `your_client_secret` | Optional, for Codex OAuth |
| `NEXTAUTH_SECRET` | `be33a334...` | 64 hex chars |
| `ENCRYPTION_KEY` | `32d33052...` | 64 hex chars, exactly 32 bytes |

## Step-by-Step Fill-In Process

### 1. Go to App Settings
```
https://github.com/settings/apps/speqforge
```

### 2. From "About" Section, Copy:
```
Field: App ID
Value: 123456
→ Add to .env.local: GITHUB_APP_ID=123456
```

### 3. From "About" Section, Copy:
```
Field: Client ID  
Value: Iv2.abc123def456789
→ Add to .env.local: NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv2.abc123def456789
```

### 4. Generate Client Secret:
```
Button: "Generate a new client secret"
Click it and copy the new secret
Value: secret_ghs_abc123def456...
→ Add to .env.local: GITHUB_OAUTH_CLIENT_SECRET=secret_ghs_abc123def456...
```

### 5. Generate Private Key:
```
Section: Private Keys
Button: "Generate a private key"
Click to download speqforge.private-key.pem
Open the file in text editor and copy entire contents
Value: 
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2a2j...
...
-----END RSA PRIVATE KEY-----
→ Add to .env.local: GITHUB_APP_PRIVATE_KEY=[entire contents above]
```

### 6. (Optional) Copy Webhook Secret:
```
If you set a webhook secret in GitHub settings, copy it
Value: abc123def456...
→ Add to .env.local: GITHUB_APP_WEBHOOK_SECRET=abc123def456...
```

## Complete Example .env.local

```bash
# Database
DATABASE_URL="file:./dev.db"

# GitHub App (from https://github.com/settings/apps/speqforge)
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2a2j4...
... [rest of PEM key] ...
bA3+HcvQ==
-----END RSA PRIVATE KEY-----
GITHUB_APP_WEBHOOK_SECRET=abc123def456789abc123def456789abc123def456789abc123def456789ab

# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv2.abc123def456789
GITHUB_OAUTH_CLIENT_SECRET=secret_ghs_abc123def456789abc123def456789
# OpenAI OAuth (optional - for Codex BYOK)
OPENAI_OAUTH_CLIENT_ID=your_openai_client_id
OPENAI_OAUTH_CLIENT_SECRET=your_openai_client_secret
# Auth & Security
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=be33a3342959d8cd16cb66fe489e1be6a1c30c20c18f3bbf0c07fe5a682c91f9
ENCRYPTION_KEY=32d330520fb901bc678eec0025b680b35253e28e335952ca78fbfa0922d09723

# Logging
LOG_LEVEL=info
```

## Validation Commands

Run these to verify your setup:

```bash
# Check all required vars are set
echo "Checking environment variables..."
grep -E "^GITHUB_APP_ID=|^NEXT_PUBLIC_GITHUB_CLIENT_ID=|^GITHUB_OAUTH_CLIENT_SECRET=" .env.local

# Expected output:
# GITHUB_APP_ID=123456
# NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv2.abc123...
# GITHUB_OAUTH_CLIENT_SECRET=secret_...
```

## Common Mistakes & Fixes

| Mistake | Fix |
|---------|-----|
| Copying "Client Secret" but GitHub shows a blank field | Generate a new secret with the button, don't assume it exists |
| Using old Client Secret instead of newly generated one | Always use the "Generate a new client secret" output |
| Forgetting the `-----BEGIN RSA PRIVATE KEY-----` prefix | Copy the entire `.pem` file contents, including dashes |
| Extra spaces or line breaks in values | Remove any leading/trailing whitespace |
| Putting quotes around `GITHUB_APP_ID` | Numbers don't need quotes: `GITHUB_APP_ID=123456` not `GITHUB_APP_ID="123456"` |
| Multi-line values on single line | For private key, let it span multiple lines naturally |

## Testing

Once you've filled in everything:

```bash
# Restart dev server
bun run dev

# Visit login page
open http://localhost:3000/login

# Click "Sign in with GitHub" and follow the flow
```

You should be able to log in successfully!

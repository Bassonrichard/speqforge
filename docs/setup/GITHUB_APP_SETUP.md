# GitHub App Setup Guide for SeqForge

This guide walks you through creating and configuring a GitHub App for SeqForge development.

## What You'll Need

- A GitHub account (personal or organization)
- 15 minutes
- Your local development environment

## Step-by-Step Setup

### Step 1: Navigate to GitHub App Creation

1. Go to **[GitHub Settings → Developer Settings](https://github.com/settings/developers)**
2. Click the **GitHub Apps** tab on the left sidebar
3. Click **New GitHub App**

### Step 2: Basic Information

Fill in the following details:

#### GitHub App name
```
Speqforge
```
The name displayed to users and in your GitHub settings.

#### Homepage URL
```
http://localhost:3000
```
Where users can learn more about your app.

#### Description (Optional)
```
AI-powered specification portal for feature management and collaboration
```

### Step 3: Webhook Configuration

**Webhook URL** (optional for development, required for production):
```
http://localhost:3000/api/github/webhook
```

**Webhook Secret** (generate a secure secret):
```bash
# Generate using OpenSSL
openssl rand -hex 32
# Example output: abc123def456...
```
Copy the generated secret and save it for `.env.local`

**Webhook Events to Subscribe to:**
- ✅ `Installation target` - When app is installed/uninstalled
- ✅ `Push` - When code is pushed
- ✅ `Pull request` - When PR is created/updated
- ✅ `Meta` - App management events

### Step 4: Identifying and Authorizing Users (OAuth)

**Callback URL:**
```
http://localhost:3000/auth/callback
```
This is where GitHub redirects users after they authorize your app.

**OAuth Settings:**
- ✅ **Expire user authorization tokens** - Enabled (for security)
- ✅ **Request user authorization (OAuth) during installation** - Enabled (let the app request access)

### Step 5: Permissions

#### Repository Permissions
| Permission | Level | Notes |
|-----------|-------|-------|
| Contents | Read & Write | Create branches, update files, commit specs |
| Pull requests | Read & Write | Create/manage PRs for spec changes |
| Checks | Read & Write | Enforce spec approval via GitHub Checks |

#### Organization Permissions
| Permission | Level | Notes |
|-----------|-------|-------|
| Members | Read | View org members for RBAC |

#### Account Permissions (User Data)
| Permission | Level | Notes |
|-----------|-------|-------|
| Email addresses | Read | Get user email for profile |
| User data | Read | Get user info (name, avatar) |

### Step 6: Installation

**Where can this GitHub App be installed?**
- Select: **Only on this account** (for local development)
  - After testing, you can change to **Any account** for production

### Step 7: Create the App

Click **Create GitHub App**

You'll be redirected to your app's settings page. This is where you'll get your credentials.

## Step 3: Get Your Credentials

### GitHub App Credentials

On your app settings page, you'll find:

1. **App ID** (in the "About" section at the top)
   - Example: `123456`
   - Copy to: `GITHUB_APP_ID` in `.env.local`

2. **Private Key** (scroll to bottom, under "Private keys")
   - Click **Generate a private key**
   - A `.pem` file will download
   - Open it in a text editor
   - Copy the entire contents (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)
   - Paste into: `GITHUB_APP_PRIVATE_KEY` in `.env.local`

3. **Client ID** (in the "About" section)
   - Example: `Iv2.abc123def456`
   - Copy to: `NEXT_PUBLIC_GITHUB_CLIENT_ID` in `.env.local`

4. **Client Secret** (in the "About" section, click "Generate a new client secret")
   - Copy to: `GITHUB_OAUTH_CLIENT_SECRET` in `.env.local`

### Save Your Webhook Secret

If you generated a webhook secret in Step 3, save it:
- Copy to: `GITHUB_APP_WEBHOOK_SECRET` in `.env.local`

## Step 4: Update .env.local

Create or update `.env.local` in your project root:

```bash
# Database Connection
DATABASE_URL="file:./dev.db"

# GitHub App Credentials
# Get these from: https://github.com/settings/apps/your-app-name
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET=your-webhook-secret

# GitHub OAuth Credentials
# Same app as above, find in "Client ID" and "Client Secret" fields
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-client-secret

# Authentication & Security
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=be33a3342959d8cd16cb66fe489e1be6a1c30c20c18f3bbf0c07fe5a682c91f9
ENCRYPTION_KEY=32d330520fb901bc678eec0025b680b35253e28e335952ca78fbfa0922d09723
```

⚠️ **IMPORTANT**: Never commit `.env.local` to git. Use `.env.example` for non-secret values.

## Step 5: Test Your Setup

1. **Start the development server:**
   ```bash
   bun run dev
   ```

2. **Visit the login page:**
   ```
   http://localhost:3000/login
   ```

3. **Click "Sign in with GitHub"**
   - You'll be redirected to GitHub
   - GitHub will ask for permission
   - Click "Authorize"
   - You should be redirected back to the dashboard

4. **If something goes wrong:**
   - Check the terminal for error messages
   - Verify all credentials are correct in `.env.local`
   - Check that redirect URL matches exactly: `http://localhost:3000/auth/callback`

## Troubleshooting

### "GitHub OAuth not configured"
**Cause**: `NEXT_PUBLIC_GITHUB_CLIENT_ID` is missing or empty

**Fix**:
1. Go to your app settings: https://github.com/settings/apps
2. Click your app name
3. Find "Client ID" in the "About" section
4. Copy it to `NEXT_PUBLIC_GITHUB_CLIENT_ID` in `.env.local`
5. Restart the dev server

### "Invalid client_id" or "Redirect URI mismatch"
**Cause**: Incorrect credentials or callback URL doesn't match

**Fix**:
1. Verify `NEXT_PUBLIC_GITHUB_CLIENT_ID` is exactly as shown in app settings
2. Verify `GITHUB_OAUTH_CLIENT_SECRET` is the latest generated secret (not blank)
3. In GitHub app settings, verify **Callback URL** is exactly: `http://localhost:3000/auth/callback`
4. Restart dev server

### "Failed to fetch user" after login
**Cause**: `GITHUB_OAUTH_CLIENT_SECRET` is missing or incorrect

**Fix**:
1. Go to your app settings: https://github.com/settings/apps
2. Scroll to "Client secrets"
3. Click "Generate a new client secret"
4. Copy the entire new secret (not the old one)
5. Paste into: `GITHUB_OAUTH_CLIENT_SECRET` in `.env.local`
6. Restart dev server

### Still getting auth errors?
1. Open your browser console (F12) and check for error messages
2. Check the terminal where you ran `bun run dev` for server-side errors
3. Make sure you're not using a private browser window (check cookies)
4. Try deleting `.next/` folder and restarting dev server

## Verifying Installation

### Check if app is installed on your account:
1. Go to **[Your Settings → Applications → Authorized OAuth Apps](https://github.com/settings/applications)**
2. You should see "Speqforge" listed
3. Click it to see granted permissions

### Revoke access (to start fresh):
1. From the app details page, click **Revoke access**
2. Go back to login page and sign in again (it will ask for new permissions)

## Production Deployment

When deploying to production:

1. **Create a new GitHub App** (don't reuse localhost app)
2. Use your production domain for URLs:
   - Homepage URL: `https://yourdomain.com`
   - Callback URL: `https://yourdomain.com/auth/callback`
   - Webhook URL: `https://yourdomain.com/api/github/webhook`
3. Update environment variables on your hosting platform
4. Change installation setting to **Any account** (if allowing other orgs)
5. Set webhook secret to a strong value and save in production secrets

## Need Help?

- **GitHub App Docs**: https://docs.github.com/en/apps
- **OAuth Flow**: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps
- **Webhook Documentation**: https://docs.github.com/webhooks-and-events/webhooks/about-webhooks

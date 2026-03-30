# GitHub App Setup Checklist for SeqForge

Use this checklist to verify you've completed all setup steps.

## ✅ GitHub App Creation

- [ ] Navigated to https://github.com/settings/apps
- [ ] Clicked "New GitHub App"
- [ ] Entered app name: `Speqforge`
- [ ] Entered homepage URL: `http://localhost:3000`
- [ ] Entered callback URL: `http://localhost:3000/auth/callback` (under "Identifying and authorizing users")
- [ ] Set webhook URL: `http://localhost:3000/api/github/webhook` (optional for dev)
- [ ] Generated webhook secret: `openssl rand -hex 32`
- [ ] Enabled "Expire user authorization tokens"
- [ ] Enabled "Request user authorization (OAuth) during installation"

## ✅ Permissions Configuration

**Repository Permissions:**
- [ ] Contents: Read & Write
- [ ] Pull requests: Read & Write
- [ ] Checks: Read & Write

**Account Permissions:**
- [ ] Email addresses: Read
- [ ] User data: Read

**Webhook Subscriptions:**
- [ ] Installation target
- [ ] Push
- [ ] Pull request
- [ ] Meta (optional)

## ✅ Installation Settings

- [ ] Selected "Only on this account" (for development)
- [ ] Clicked "Create GitHub App"
- [ ] Verified app was created successfully

## ✅ Credentials Collection

From your GitHub App settings page, collected:

- [ ] **App ID** → Example format: `123456`
- [ ] **Client ID** → Example format: `Iv2.abc123def456`
- [ ] **Client Secret** → Clicked "Generate a new client secret" and copied value
- [ ] **Private Key** → Clicked "Generate a private key", downloaded `.pem` file, copied contents
- [ ] **Webhook Secret** → Copied from step 1 (or generated new one)

## ✅ Environment Variables

Created/updated `.env.local` with:

```
GITHUB_APP_ID=[App ID from step above]
GITHUB_APP_PRIVATE_KEY=[Full PEM contents]
GITHUB_APP_WEBHOOK_SECRET=[Webhook secret]
NEXT_PUBLIC_GITHUB_CLIENT_ID=[Client ID]
GITHUB_OAUTH_CLIENT_SECRET=[Client Secret]
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[Secure random 32 bytes]
ENCRYPTION_KEY=[Secure random 32 bytes]
```

- [ ] All values filled in (no blank fields where applicable)
- [ ] No quotation marks around values (except DATABASE_URL for path)
- [ ] No extra spaces or line breaks
- [ ] `.env.local` is in project root directory
- [ ] `.env.local` is NOT committed to git (in `.gitignore`)

## ✅ Database Setup

- [ ] Ran `bun run db:generate`
- [ ] Ran `bun install` (to ensure dependencies installed)

## ✅ Testing Login Flow

- [ ] Started dev server: `bun run dev`
- [ ] Server says "Ready in XXXms" with no errors
- [ ] Navigated to http://localhost:3000/login
- [ ] Clicked "Sign in with GitHub"
- [ ] Redirected to GitHub.com login
- [ ] Authorized the app (clicked "Authorize")
- [ ] Redirected back to http://localhost:3000/dashboard
- [ ] Dashboard loaded successfully
- [ ] User info displayed in header

## ✅ Verification

If everything is working:

- [ ] Can log in with GitHub account
- [ ] Can access the dashboard
- [ ] No 401 or 500 errors in browser
- [ ] No errors in terminal/console
- [ ] "Sign in with GitHub" button works on login page
- [ ] Session persists when navigating pages
- [ ] Logout works correctly

## ❌ Common Issues & Fixes

If you encounter issues, check:

| Issue | Checklist |
|-------|-----------|
| "GitHub OAuth not configured" | [ ] `NEXT_PUBLIC_GITHUB_CLIENT_ID` is not empty [ ] Restart dev server |
| "Invalid client_id" | [ ] Client ID is correct (starts with `Iv2.`) [ ] No extra spaces [ ] Restart dev server |
| "Redirect URI mismatch" | [ ] Callback URL in GitHub app is exactly `http://localhost:3000/auth/callback` [ ] No trailing slash [ ] No typos |
| Can't see "Sign in with GitHub" button | [ ] Check browser console (F12) for JS errors [ ] Check terminal for server errors [ ] Restart dev server |
| Stuck on loading after clicking button | [ ] Check network tab in DevTools [ ] Check terminal for errors [ ] Verify Client Secret is correct |
| "Failed to fetch user" | [ ] `GITHUB_OAUTH_CLIENT_SECRET` is not blank [ ] It's the latest generated secret [ ] Restart dev server |
| Login works but stuck on blank page | [ ] Database is initialized (`dev.db` file exists) [ ] Check browser console for errors [ ] Check terminal for database errors |

## 📋 Reference: Where to Find Each Value

| Value | Location |
|-------|----------|
| App ID | https://github.com/settings/apps → Your App → "About" section → "App ID" |
| Client ID | Same app → "About" section → "Client ID" |
| Client Secret | Same app → "About" section → Click "Generate a new client secret" |
| Private Key | Same app → Scroll to bottom → "Private keys" → "Generate a private key" |
| Webhook Secret | From `openssl rand -hex 32` command you ran |

## ✅ Final Verification Command

Run this in your project directory to verify setup:

```bash
# Check environment file exists and has required vars
grep -E "GITHUB_APP_ID|NEXT_PUBLIC_GITHUB_CLIENT_ID|GITHUB_OAUTH_CLIENT_SECRET" .env.local

# Check database file was created
ls -la | grep dev.db

# Check dependencies are installed
ls -la node_modules/@prisma/client
```

All three should return results without errors.

---

**Need help?** See [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md) for detailed instructions or check the [README.md](../README.md) troubleshooting section.

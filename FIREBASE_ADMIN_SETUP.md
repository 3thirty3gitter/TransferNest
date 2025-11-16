# Firebase Admin Setup for Orders API

The Orders API requires Firebase Admin credentials to access Firestore from server-side API routes.

## Steps to Fix the 500 Error:

### 1. Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `transfernest-12vn4`
3. Click the gear icon ⚙️ > **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file (e.g., `service-account-key.json`)

### 2. Base64 Encode the Key

Run this command with your downloaded JSON file:

```bash
# On Linux/Mac
cat service-account-key.json | base64 -w 0 > service-account-base64.txt

# Or use Node.js
node -e "console.log(Buffer.from(require('fs').readFileSync('service-account-key.json')).toString('base64'))" > service-account-base64.txt
```

### 3. Add to Vercel Environment Variable

1. Go to your Vercel project dashboard
2. Go to **Settings** > **Environment Variables**
3. Add a new variable:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the base64-encoded string from step 2
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**

### 4. Redeploy

After adding the environment variable, trigger a new deployment:

1. Go to **Deployments** tab
2. Click the three dots ⋯ on the latest deployment
3. Click **Redeploy**

OR push a new commit to trigger auto-deployment.

### 5. Verify

After redeployment, the Orders API should work:
- Go to `/orders` page
- You should see your order history without 500 errors

## What Changed

The code now:
- Checks for `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
- Decodes and parses the service account credentials
- Initializes Firebase Admin with explicit credentials
- Provides detailed error messages if credentials are missing or invalid

## Local Development

For local development, you can also add the variable to `.env.local`:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY=<your-base64-encoded-key>
```

**⚠️ Never commit service account keys to Git!**

## Troubleshooting

If you still get errors after setup:
1. Check Vercel logs for specific error messages
2. Verify the base64 encoding is correct (no extra newlines/spaces)
3. Make sure the service account has Firestore access enabled
4. Confirm the environment variable name matches exactly: `FIREBASE_SERVICE_ACCOUNT_KEY`

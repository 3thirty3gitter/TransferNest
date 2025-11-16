# AI Features Setup - Gemini API Key

The product management system includes AI-powered description and SEO generation using Google Gemini.

## Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the generated API key

## Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add a new variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your API key from Google AI Studio
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

## Add to Local Development (Optional)

Create or update `.env.local` in the project root:

```bash
GEMINI_API_KEY=your_api_key_here
```

**⚠️ Never commit API keys to Git!**

## Features Enabled

Once configured, admins can:

### ✨ AI Description Generator
- Enter keywords (e.g., "DTF transfers, gang sheets, custom printing")
- Click "✨ Generate Description"
- AI writes SEO-optimized product description
- 2-3 sentences, professional tone, keyword-integrated

### ✨ AI SEO Generator  
- Enter product details and keywords
- Click "✨ Generate SEO"
- AI creates:
  - Meta Title (50-60 characters)
  - Meta Description (150-160 characters)
  - Keyword list (6-8 relevant terms)

## Pricing

Google Gemini API offers:
- **Free tier**: 60 requests per minute
- Generous free quota for development
- Very affordable paid tiers if needed

For small to medium product catalogs, the free tier should be sufficient.

## Troubleshooting

### "AI service not configured" error
- API key not added to Vercel environment variables
- Redeploy after adding the key

### 500 errors when generating
- Check Vercel logs for specific error messages
- Verify API key is valid in Google AI Studio
- Ensure API key has proper permissions

### Rate limits
- Free tier: 60 requests/minute
- Spread out bulk generation or upgrade to paid tier

## Alternative: Manual Entry

If you prefer not to use AI features:
- Simply type descriptions and SEO data manually
- AI buttons are optional - all fields can be filled manually
- Products work perfectly without AI-generated content

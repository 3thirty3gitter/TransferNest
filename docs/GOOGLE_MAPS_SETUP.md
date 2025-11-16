# Google Maps Address Autocomplete Setup

This application uses Google Maps Places API for address autocomplete on the checkout and account pages.

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API**
   - **Maps JavaScript API**
4. Create an API key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### 2. Secure Your API Key (Recommended)

1. Click on your API key to edit it
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain(s):
     - `http://localhost:3000/*` (for development)
     - `https://yourdomain.com/*` (for production)
3. Under "API restrictions":
   - Select "Restrict key"
   - Select only:
     - Places API
     - Maps JavaScript API

### 3. Add to Environment Variables

Add the API key to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important:** The key must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### 4. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## Features

The address autocomplete provides:

- **Auto-fill**: As users type their address, Google suggests matching addresses
- **Complete data**: Automatically fills in:
  - Street address
  - City
  - Province/State
  - Postal/ZIP code
  - Country
- **Country restriction**: Suggestions are filtered by the selected country (Canada or US)

## Cost Considerations

Google Maps Places API has the following pricing (as of 2024):

- **Autocomplete - Per Session**: $2.83 per 1,000 sessions
- **Monthly free tier**: $200 credit (approximately 70,000 autocomplete sessions)

For most small to medium businesses, you'll likely stay within the free tier.

### Monitoring Usage

1. Go to Google Cloud Console
2. Navigate to "APIs & Services" > "Dashboard"
3. View usage statistics for Places API

## Fallback Behavior

If the Google Maps API key is not configured:
- A warning will be logged to the console
- Address fields will function as regular text inputs
- Users can still manually enter their address information

## Troubleshooting

### Address autocomplete not working?

1. **Check browser console** for error messages
2. **Verify API key** is correct in `.env.local`
3. **Confirm APIs are enabled** in Google Cloud Console
4. **Check restrictions** - make sure your domain is whitelisted
5. **Restart dev server** after changing environment variables

### "This page can't load Google Maps correctly"

This means:
- The API key is invalid or restricted
- The referrer (your domain) is not whitelisted
- The Places API is not enabled for your project

### Suggestions not appearing?

- Make sure you're typing a valid address format
- Check that the country restriction matches your intended region
- Verify network connection (API requires internet access)

## Development Notes

The component is located at: `/src/components/address-autocomplete.tsx`

It's used in:
- `/src/app/account/page.tsx` (customer profile)
- `/src/app/checkout/page.tsx` (contact and shipping addresses)

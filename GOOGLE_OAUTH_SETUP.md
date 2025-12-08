# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the DFC Medical application.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "DFC Medical")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - App name: DFC Medical
   - User support email: Your email
   - Developer contact information: Your email
5. Click "Save and Continue"
6. On the Scopes page, click "Add or Remove Scopes"
7. Add the following scopes:
   - `openid`
   - `email`
   - `profile`
8. Click "Save and Continue"
9. Add test users if needed (for development)
10. Click "Save and Continue"

## Step 4: Create OAuth Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "DFC Medical Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000` (for development)
   - Your production URL (e.g., `https://yourdomain.com`)
6. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
7. Click "Create"
8. Copy the "Client ID" and "Client Secret"

## Step 5: Update Environment Variables

1. Open your `.env` file
2. Update the following variables with your credentials:
   ```
   GOOGLE_CLIENT_ID="your-client-id-from-step-4"
   GOOGLE_CLIENT_SECRET="your-client-secret-from-step-4"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to the login page
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be redirected back to the application and logged in

## Production Deployment

When deploying to production:

1. Update the OAuth consent screen with your production domain
2. Add your production URL to the authorized origins and redirect URIs
3. Update the `NEXT_PUBLIC_APP_URL` environment variable to your production URL
4. Make sure to use HTTPS in production

## Troubleshooting

### "Error 400: redirect_uri_mismatch"

- Make sure the redirect URI in your Google Cloud Console matches exactly with the one in your application
- Check that you've added both development and production URLs

### "Error 403: access_denied"

- Make sure you've added your email as a test user in the OAuth consent screen
- Check that the required scopes are enabled

### "This app isn't verified"

- This is normal for apps in development
- Click "Advanced" and then "Go to [App Name] (unsafe)" to continue
- For production, you'll need to submit your app for verification

## Security Notes

- Never commit your `.env` file to version control
- Use different OAuth credentials for development and production
- Regularly rotate your client secret
- Monitor your OAuth usage in the Google Cloud Console

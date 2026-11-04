# Google sign-in setup

The application uses authorization-code OAuth with PKCE through Supabase. It requests basic identity scopes (`openid email profile`), not Drive, Gmail or Calendar access.

The Google Cloud project prepared for this game is **Project 404**, project ID `dauntless-karma-513720-u6`. The web client is named **Project 404 — Web Sign-in**.

Its exact Google authorized redirect URI is:

```text
https://funyhgrgprhlkhkujanx.supabase.co/auth/v1/callback
```

The owner generated the client credentials and entered them directly in Supabase's Google provider settings. They do not belong in source, chat, Vercel VITE variables or Git.

## Production allowlist

In Supabase Authentication → URL Configuration, set the Site URL to the final production HTTPS origin. Add the exact production `/auth/callback` URL. Add `http://127.0.0.1:5173/auth/callback` only when developing with the cloud backend. Avoid broad production wildcard redirects.

In Google Auth Platform → Audience, test mode restricts access to explicitly configured test users. Public release requires the appropriate production audience configuration. Branding and any verification requirements remain under the owner's Google account.

## Login restrictions

- Enable Google.
- Disable anonymous and email/password sign-in.
- Leave manual identity linking disabled.
- Keep the existing Auth rate limits and review them alongside expected traffic.
- The Edge API independently rejects unsupported identities even if another provider is accidentally enabled.
- Every progress key is derived from the verified user ID and validated browser UUID. The browser cannot choose another user's owner ID.

## Apple

Apple support is deferred at the owner's request. Its button appears only when the provider is actually enabled. Future setup requires a configured Apple Developer Services ID and signing credentials entered directly in Supabase, plus expiry/rotation management for the Apple client secret.

## Validation limits

An enabled-provider flag proves configuration is enabled, not that a real consent/token exchange has succeeded. Validate the full deployed login, callback, name registration, refresh, sign-out and second-browser isolation before marking OAuth end-to-end verification complete.

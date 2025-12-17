# SMTP Configuration for Gmail

## Environment Variables

You need to set these environment variables in your Supabase Dashboard → Edge
Functions → Secrets:

```bash
# SMTP Configuration (Gmail)
SMTP_USERNAME=pushtopost@gmail.com
SMTP_PASSWORD=<your-app-password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
USE_SMTP=true

# Keep these for Supabase
SUPABASE_URL=https://tmvwqggielmjjiqdlskb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Optional: For display name
FROM_NAME=PushToPost Team
```

## Important Security Note

> **⚠️ WARNING**: Using your actual Gmail password is not recommended! Gmail may
> block sign-ins from "less secure apps."

### Recommended: Use Gmail App Password

For better security and to avoid authentication issues, you should:

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already
   enabled)
3. Navigate to **Security** → **App passwords**
4. Generate a new app password for "Mail"
5. Use this 16-character app password instead of "pakistan"
6. Update the environment variable:
   ```bash
   SMTP_PASSWORD=<your-16-character-app-password>
   ```

## How It Works

The `add-to-waitlist` edge function now uses **denomailer** (native Deno SMTP
client) to send emails via Gmail's SMTP server:

- **SMTP Client**: denomailer v1.6.0 (Deno-native, no npm dependencies)
- **Host**: smtp.gmail.com
- **Port**: 587 (STARTTLS)
- **Authentication**: Your Gmail credentials
- **From**: PushToPost Team <pushtopost@gmail.com>

## Switching Back to Resend

If you want to use Resend in the future:

1. In
   `/home/abd/linkedIn-Code-Post/supabase/functions/add-to-waitlist/index.ts`:
   - Comment out the SMTP section (lines ~229-271)
   - Uncomment the Resend section (lines ~273-300)
   - Set `USE_SMTP=false` environment variable
2. Set `RESEND_API_KEY` environment variable
3. Redeploy: `npx supabase functions deploy add-to-waitlist`

## Testing

Test the email sending:

```bash
curl -X POST https://tmvwqggielmjjiqdlskb.supabase.co/functions/v1/add-to-waitlist \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "apikey: <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Check your email inbox and the edge function logs to verify the email was sent
successfully!

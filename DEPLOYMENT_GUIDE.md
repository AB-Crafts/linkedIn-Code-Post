# Edge Functions Deployment Guide

## Prerequisites

Ensure you have:

- Supabase CLI installed
- Logged into your Supabase project
- Environment variables configured

## Deploy Commands

```bash
# Navigate to project directory
cd /home/abd/linkedIn-Code-Post

# Deploy get-waitlist-count function
supabase functions deploy get-waitlist-count

# Deploy add-to-waitlist function
supabase functions deploy add-to-waitlist
```

## Set Environment Variables

Configure these in your Supabase Dashboard → Edge Functions → Secrets:

```bash
# Required for both functions
SUPABASE_URL=https://tmvwqggielmjjiqdlskb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Required for add-to-waitlist function (email sending)
BREVO_API_KEY=your_brevo_api_key_here
FROM_EMAIL=pushtopost@gmail.com
FROM_NAME="PushToPost Team"
```

> **Note**: The `SUPABASE_SERVICE_ROLE_KEY` is different from the anon key. Find
> it in Supabase Dashboard → Settings → API.

## Verify Deployment

After deploying, test the functions:

### Test get-waitlist-count

```bash
curl https://tmvwqggielmjjiqdlskb.supabase.co/functions/v1/get-waitlist-count
```

Expected response:

```json
{ "count": 123 }
```

### Test add-to-waitlist

```bash
curl -X POST https://tmvwqggielmjjiqdlskb.supabase.co/functions/v1/add-to-waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected response (success):

```json
{"success": true, "data": [...], "emailSent": true}
```

Expected response (duplicate):

```json
{ "error": "This email is already on the waitlist!", "duplicate": true }
```

## Troubleshooting

If functions fail to invoke:

1. Check environment variables are set correctly
2. Verify service role key has correct permissions
3. Check Supabase function logs for errors

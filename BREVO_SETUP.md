# Brevo API Configuration

To enable email sending for the waitlist, you need to configure the Brevo API
key in your Supabase project.

## 1. Get your Brevo API Key

1. Sign in to your [Brevo account](https://app.brevo.com/).
2. Go to **Settings** (top right) → **SMTP & API**.
3. Create a new API key (v3).

## 2. Set Supabase Secrets

Run the following commands using the Supabase CLI, or add them manually in the
Supabase Dashboard under **Edge Functions > Secrets**:

```bash
# Required for email sending
supabase secrets set BREVO_API_KEY=your_brevo_api_key_here

# Optional: Configuration for "From" address
supabase secrets set FROM_EMAIL=pushtopost@gmail.com
supabase secrets set FROM_NAME="PushToPost Team"
```

## 3. Verify Your Sender

Ensure that the email address you use in `FROM_EMAIL` is a verified sender in
your Brevo account (**Settings > Senders, Domains & Dedicated IPs**).

## 4. Redeploy

Once the secrets are set, redeploy your function:

```bash
npx supabase functions deploy add-to-waitlist
```

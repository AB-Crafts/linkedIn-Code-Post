# Resend Email Setup Guide

Complete guide for setting up and using the Resend email system to send thank
you emails to your PushToPost waitlist subscribers.

## Prerequisites

- Node.js installed (version 14 or higher)
- Active Supabase project with waitlist data
- Resend account (free tier available)

---

## Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click **Sign Up** and create an account
3. Verify your email address

## Step 2: Add and Verify Your Domain

For production email sending, you need to verify your domain: (Note: You
**cannot** verify free subdomains like `pushtopost.netlify.app` or `verce.app`.
You must own a custom domain like `pushtopost.com`).

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `pushtopost.dev`)
4. Add the DNS records to your domain provider:
   - Add the TXT record for verification
   - Add DKIM, SPF, and DMARC records for email authentication
5. Wait for verification (usually takes a few minutes)

### For Testing Without a Domain

If you don't have a domain yet, you can use Resend's test domain:

- Use `onboarding@resend.dev` as your FROM_EMAIL
- Test emails will be sent but may have limitations

## Step 3: Generate API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "PushToPost Waitlist Emails")
4. Select permissions: **Sending access**
5. Click **Create**
6. **Copy the API key** (you won't see it again!)

## Step 4: Get Supabase Service Role Key

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (under "Project API keys")
4. Copy this key

> [!CAUTION]
> The service_role key has full database access. Never expose it in client-side
> code or public repositories!

## Step 5: Configure Environment Variables

1. Create a `.env` file in your project root:

```bash
cp .env.example .env
```

2. Edit the `.env` file and add your credentials:

```bash
# Supabase Configuration
SUPABASE_URL=https://tmvwqggielmjjiqdlskb.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@pushtopost.dev
FROM_NAME=PushToPost Team

# Web3Forms (already configured)
WEB3FORMS_ACCESS_KEY=f3c76718-4e27-4eec-b4fe-d982aede695c
```

> [!IMPORTANT]
> **Security**: Never commit your `.env` file to Git! Make sure `.env` is in
> your `.gitignore` file.

## Step 6: Install Dependencies

Run this command in your project directory:

```bash
npm install
```

This will install:

- `resend` - Official Resend SDK
- `@supabase/supabase-js` - Supabase client
- `dotenv` - Environment variable loader

---

## Usage

### Test Mode (Recommended First Step)

Before sending to all subscribers, test with your own email:

```bash
node send-emails.js --test your.email@example.com
```

This will:

- Send the email only to your test address
- Let you verify the email looks correct
- Check that all integrations work

**What to check in the test email:**

- ✅ Email formatting and styling
- ✅ All links work correctly
- ✅ Images load properly
- ✅ Content is accurate
- ✅ Email doesn't land in spam

### Send to All Subscribers

Once you've verified the test email looks good:

```bash
node send-emails.js
```

This will:

- Fetch all emails from your Supabase waitlist
- Send emails in batches of 10 with rate limiting
- Display progress in real-time
- Show a final summary of sent/failed emails

**Expected output:**

```
🚀 PushToPost Email Sender
══════════════════════════════════════════════════
✅ Email template loaded
📥 Fetching emails from Supabase...
✅ Found 156 subscribers in waitlist

📧 Starting email campaign...
──────────────────────────────────────────────────
Total subscribers: 156
Batch size: 10
Delay between batches: 2000ms
──────────────────────────────────────────────────

📦 Batch 1/16 (10 emails):
   ✅ Sent to user1@example.com
   ✅ Sent to user2@example.com
   ...
   Progress: 10/156 sent (6.4%)

...

══════════════════════════════════════════════════
📊 Campaign Results:
──────────────────────────────────────────────────
Total subscribers: 156
✅ Successfully sent: 156
❌ Failed: 0
══════════════════════════════════════════════════

✨ Email campaign completed!
💡 Check your Resend dashboard for delivery analytics
```

---

## Customizing the Email Template

The email template is in `email-template.html`. You can customize:

- **Content**: Edit the text and messaging
- **Styling**: Modify colors, fonts, and layout
- **Links**: Update URLs to match your website
- **Images**: Add your logo or other graphics
- **Launch date**: Change the date if needed

After making changes, test again before sending to all subscribers.

---

## Monitoring Email Delivery

### Resend Dashboard

1. Go to [https://resend.com/emails](https://resend.com/emails)
2. View all sent emails with status:
   - **Delivered** ✅
   - **Bounced** ⚠️
   - **Spam complaint** 🚫
3. Click on any email to see detailed logs

### Email Analytics

Track:

- Delivery rate
- Bounce rate
- Open rate (if tracking is enabled)
- Click rate on links

---

## Troubleshooting

### Error: "RESEND_API_KEY is missing"

→ Make sure you've created a `.env` file (not just `.env.example`) → Check that
the API key is correctly set in `.env`

### Error: "Email template not found"

→ Ensure `email-template.html` exists in the same directory as `send-emails.js`

### Error: "Error fetching emails from Supabase"

→ Check that your `SUPABASE_SERVICE_KEY` is correct (not the anon key) → Verify
your Supabase project is accessible

### Emails are going to spam

→ Make sure your domain is verified in Resend → Add proper SPF, DKIM, and DMARC
DNS records → Avoid spam trigger words in your email content → Warm up your
domain by sending small batches first

### Rate limit errors

→ Resend free tier allows 100 emails/day → Paid plans have higher limits →
Adjust `EMAILS_PER_BATCH` and `DELAY_BETWEEN_BATCHES` in the script

### Bounced emails

→ Invalid or non-existent email addresses → Check your Supabase data for typos →
Some email providers block bulk senders

---

## Rate Limits

### Resend Free Tier

- 100 emails per day
- 3,000 emails per month

### Resend Pro Plan

- Unlimited emails
- Better deliverability
- Priority support

If you have more than 100 subscribers, consider:

1. Running the script over multiple days
2. Upgrading to Resend Pro
3. Adjusting the batch size to fit within limits

---

## Best Practices

1. **Always test first**: Use `--test` mode before bulk sending
2. **Send during business hours**: Better engagement rates
3. **Monitor bounces**: Remove invalid emails from your list
4. **Respect unsubscribes**: Add an unsubscribe link if required
5. **Track metrics**: Use Resend analytics to improve future emails
6. **Warm up your domain**: Start with small batches, then scale up
7. **Personalize**: Consider adding recipient names if collected

---

## Security Notes

✅ **Safe to expose (client-side)**:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

🔒 **Never expose (server-side only)**:

- `RESEND_API_KEY`
- `SUPABASE_SERVICE_KEY`

⚠️ **Important**:

- Add `.env` to `.gitignore`
- Never commit API keys to version control
- Rotate keys if accidentally exposed

---

## Next Steps

After sending your thank you emails:

1. **Monitor delivery**: Check Resend dashboard for delivery stats
2. **Track engagement**: See who's clicking links
3. **Plan follow-ups**: Send progress updates as you approach launch
4. **Build anticipation**: Share development milestones
5. **Prepare for launch**: Set up early access for waitlist members

---

## Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Discord**: https://resend.com/discord
- **Supabase Documentation**: https://supabase.com/docs

---

**Ready to send?** Run `node send-emails.js --test your@email.com` to get
started! 🚀

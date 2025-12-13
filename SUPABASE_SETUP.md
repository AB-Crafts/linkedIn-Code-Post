# Supabase Setup Guide for PushToPost

This guide will help you set up Supabase to store user emails from your waitlist
form.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free tier available)
3. Create a new project
   - Choose a project name (e.g., "pushtopost")
   - Set a strong database password (save this!)
   - Select a region closest to your users

## Step 2: Create the Waitlist Table

Once your project is created:

1. Go to the **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste this SQL code:

```sql
-- Create waitlist table
CREATE TABLE waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  source text DEFAULT 'landing_page'::text
);

-- Enable Row Level Security (RLS)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert (for the form)
CREATE POLICY "Allow public insert" ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create a policy that allows authenticated users to view all entries
CREATE POLICY "Allow authenticated read" ON waitlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Create an index on email for faster lookups
CREATE INDEX waitlist_email_idx ON waitlist(email);

-- Create an index on created_at for sorting
CREATE INDEX waitlist_created_at_idx ON waitlist(created_at DESC);
```

4. Click **Run** or press `Ctrl/Cmd + Enter`
5. You should see "Success. No rows returned" message

## Step 3: Get Your API Credentials

1. Go to **Project Settings** (gear icon in the left sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Project API keys** > **anon** **public** (a long string starting with
     "eyJ...")

## Step 4: Update Your Code

1. Open `script.js` in your code editor
2. Find these lines near the top (around line 75):

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

3. Replace them with your actual credentials:

```javascript
const SUPABASE_URL = "https://xxxxxxxxxxxxx.supabase.co"; // Your Project URL
const SUPABASE_ANON_KEY = "eyJxxxxxxxxx..."; // Your anon public key
```

## Step 5: Test the Integration

1. Open your `index.html` file in a browser
2. Scroll to the signup form
3. Enter an email address and submit
4. Check your browser console (F12) - you should see:
   - `✅ Supabase initialized successfully`
   - `✅ Email stored in Supabase`
5. Go to your Supabase dashboard > **Table Editor** > **waitlist**
6. You should see your email entry!

## Viewing Your Waitlist Data

### Option 1: Supabase Dashboard

1. Go to **Table Editor** in your Supabase dashboard
2. Click on the **waitlist** table
3. View all your signups with timestamps

### Option 2: SQL Query

Run this in the SQL Editor to see all emails:

```sql
SELECT email, created_at, source 
FROM waitlist 
ORDER BY created_at DESC;
```

### Option 3: Export to CSV

1. Go to **Table Editor** > **waitlist**
2. Click the **Download** button to export as CSV

## Security Notes

✅ **What's secure:**

- The `anon` public key is safe to use in client-side code
- Row Level Security (RLS) is enabled
- Only insertions are allowed from the public (anonymous users)
- Reading data requires authentication

⚠️ **Important:**

- Never commit your credentials to public repositories
- Consider using environment variables for production
- The database password should NEVER be in client-side code

## Troubleshooting

### Error: "relation 'public.waitlist' does not exist"

→ Make sure you ran the SQL create table command in Step 2

### Error: "new row violates row-level security policy"

→ Check that you created the RLS policies in Step 2

### Error: "duplicate key value violates unique constraint"

→ The email already exists in the database (this is expected behavior)

### Console shows: "⚠️ Supabase credentials not configured"

→ You haven't updated the SUPABASE_URL and SUPABASE_ANON_KEY in script.js

### No errors but data not appearing in Supabase

→ Check browser console for any error messages → Verify your API credentials are
correct → Check that RLS policies are set up correctly

## Adding More Fields (Optional)

If you want to collect more information, modify the table:

```sql
-- Add additional columns
ALTER TABLE waitlist 
ADD COLUMN name text,
ADD COLUMN company text,
ADD COLUMN github_username text;
```

Then update the JavaScript insert code in `script.js`:

```javascript
const { data, error } = await supabase
  .from("waitlist")
  .insert([
    {
      email: email,
      name: formData.get("name"), // if you add a name field
      created_at: new Date().toISOString(),
      source: "landing_page",
    },
  ])
  .select();
```

## Next Steps

- Set up email notifications when someone joins the waitlist
- Create an admin dashboard to view and manage signups
- Export your waitlist before launch day
- Set up automated emails using Supabase Edge Functions

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Supabase GitHub: https://github.com/supabase/supabase

---

**Need help?** Check the browser console for detailed error messages, they
usually explain what went wrong!

curl -i --location --request POST
'http://127.0.0.1:54321/functions/v1/send-waitlist-email'\
--header 'Content-Type: application/json'\
--header 'Authorization: Bearer
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdndxZ2dpZWxtamppcWRsc2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzE1MTEsImV4cCI6MjA4MTEwNzUxMX0.i61GxVwChMI1kG-gft-oSU515DjXvo_pQhNEpmlpurY'\
--data '{"email":"syedabdullah9032@gmail.com"}'

// Edge function to add email to waitlist with duplicate checking and email sending
// deno-lint-ignore-file no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

// Email service utilities (choose implementation via environment variable)
import { sendEmailViaSMTP } from "../_shared/email-denomailer.ts";
import { sendEmailViaResend } from "../_shared/email-resend.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Joining PushToPost!</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .logo { font-size: 32px; font-weight: bold; color: #ffffff; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; }
        h1 { font-size: 28px; color: #1f2937; margin: 0 0 20px 0; font-weight: 700; }
        p { font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0; }
        .highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 600; }
        .cta-button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .features { background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .feature-item { display: flex; align-items: flex-start; margin-bottom: 16px; }
        .feature-item:last-child { margin-bottom: 0; }
        .feature-icon { font-size: 24px; margin-right: 12px; flex-shrink: 0; }
        .feature-text { font-size: 15px; color: #4b5563; line-height: 1.5; margin: 0; }
        .launch-date { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
        .launch-date p { color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; }
        .launch-date h2 { color: #ffffff; font-size: 32px; margin: 0; font-weight: 700; }
        .footer { background-color: #1f2937; padding: 30px; text-align: center; }
        .footer p { color: #9ca3af; font-size: 14px; margin: 0 0 8px 0; }
        .social-links { margin: 20px 0; }
        .social-links a { color: #9ca3af; text-decoration: none; margin: 0 12px; font-size: 14px; }
        .social-links a:hover { color: #ffffff; }
        @media only screen and (max-width: 600px) { .content { padding: 30px 20px; } h1 { font-size: 24px; } .cta-button { display: block; text-align: center; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">PushToPost</h1>
        </div>
        <div class="content">
            <h1>Thank You for Joining! 🎉</h1>
            <p>We're thrilled to have you on our waitlist! You're among the first to discover <span class="highlight">PushToPost</span>, the revolutionary tool that will transform how developers share their code on LinkedIn.</p>
            <p>No more screenshots, no more manual formatting. Just beautiful, syntax-highlighted code posts in seconds.</p>
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">✨</div>
                    <p class="feature-text"><strong>Instant Formatting:</strong> Paste your code and watch it transform into a stunning LinkedIn post</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🎨</div>
                    <p class="feature-text"><strong>Beautiful Syntax Highlighting:</strong> Support for 100+ programming languages</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">⚡</div>
                    <p class="feature-text"><strong>One-Click Sharing:</strong> Copy and paste directly to LinkedIn - it's that simple</p>
                </div>
            </div>
            <div class="launch-date">
                <p>Launching on</p>
                <h2>January 1, 2026</h2>
            </div>
            <p>As a waitlist member, you'll get:</p>
            <ul style="color: #4b5563; line-height: 1.8;">
                <li>Early access before the public launch</li>
                <li>Exclusive updates on development progress</li>
                <li>Special launch day perks and surprises</li>
            </ul>
            <center>
                <a href="https://pushtopost.dev" class="cta-button">Visit Our Website</a>
            </center>
            <p style="margin-top: 32px;">Have questions or feedback? Just reply to this email - we'd love to hear from you!</p>
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">Stay tuned for more updates. We can't wait to see the amazing content you'll create with PushToPost!</p>
        </div>
        <div class="footer">
            <p style="margin-bottom: 16px;"><strong style="color: #ffffff;">PushToPost</strong></p>
            <p>Made with ❤️ for developers by developers</p>
            <div class="social-links">
                <a href="https://twitter.com/pushtopost">Twitter</a>
                <a href="https://github.com/pushtopost">GitHub</a>
                <a href="https://pushtopost.dev">Website</a>
            </div>
            <p style="margin-top: 20px; font-size: 12px;">You're receiving this email because you signed up for the PushToPost waitlist.</p>
        </div>
    </div>
</body>
</html>
`;

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Parse request body
        const { email } = await req.json();

        if (!email) {
            return new Response(
                JSON.stringify({ error: "Email is required" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error(`Invalid email format: ${email}`);
            return new Response(
                JSON.stringify({ error: "Invalid email format" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Get Supabase credentials from environment
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY",
        );

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error("Missing Supabase environment variables");
        }

        // Create Supabase client with service role key for admin access
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Check if email already exists
        const { data: existingEmail, error: checkError } = await supabase
            .from("waitlist")
            .select("email")
            .eq("email", email)
            .single();

        // If we got data, email exists
        if (existingEmail) {
            console.log(`Email already exists: ${email}`);
            return new Response(
                JSON.stringify({
                    error:
                        "This email is already on the waitlist! Check your inbox for our welcome email.",
                    duplicate: true,
                }),
                {
                    status: 409, // Conflict status code
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // If error is not PGRST116 (no rows found), it's a real error
        if (checkError && checkError.code !== "PGRST116") {
            console.error("Error checking email:", checkError);
            throw checkError;
        }

        // Email doesn't exist, proceed with insertion
        const { data: insertData, error: insertError } = await supabase
            .from("waitlist")
            .insert([
                {
                    email: email,
                    created_at: new Date().toISOString(),
                    source: "landing_page",
                },
            ])
            .select();

        if (insertError) {
            // Check if it's a duplicate despite our check (race condition)
            if (
                insertError.code === "23505" ||
                insertError.message?.includes("duplicate")
            ) {
                console.log(`Duplicate detected during insert: ${email}`);
                return new Response(
                    JSON.stringify({
                        error:
                            "This email is already on the waitlist! Check your inbox for our welcome email.",
                        duplicate: true,
                    }),
                    {
                        status: 409,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }
            throw insertError;
        }

        console.log(`Email added to waitlist: ${email}`);

        // Send welcome email - choose between SMTP (Denomailer) or Resend
        let emailSent = false;
        const USE_SMTP = Deno.env.get("USE_SMTP") !== "false"; // Default to SMTP

        if (USE_SMTP) {
            // Use Denomailer (SMTP) - Active implementation
            emailSent = await sendEmailViaSMTP(
                email,
                "🎉 Thank You for Joining PushToPost!",
                EMAIL_TEMPLATE,
            );
        } else {
            // Use Resend (API) - Alternative implementation
            emailSent = await sendEmailViaResend(
                email,
                "🎉 Thank You for Joining PushToPost!",
                EMAIL_TEMPLATE,
            );
        }
        return new Response(
            JSON.stringify({
                success: true,
                data: insertData,
                emailSent: emailSent,
            }),
            {
                status: 201,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error: any) {
        console.error("Error in add-to-waitlist:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Unknown error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});

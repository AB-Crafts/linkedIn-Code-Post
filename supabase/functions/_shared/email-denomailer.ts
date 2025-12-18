// Email sending via Denomailer (Deno-native SMTP client)
// This is the active implementation

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export async function sendEmailViaSMTP(
    toEmail: string,
    subject: string,
    htmlContent: string,
): Promise<boolean> {
    try {
        // SMTP Configuration from environment variables
        const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
        const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
        const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
        const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
        const FROM_NAME = Deno.env.get("FROM_NAME") || "PushToPost Team";

        if (!SMTP_USERNAME || !SMTP_PASSWORD) {
            console.warn("SMTP credentials not configured");
            return false;
        }

        const isImplicitTLS = SMTP_PORT === 465;

        if (SMTP_PORT === 587) {
            console.warn(
                "⚠️ Port 587 (STARTTLS) is often blocked in Supabase Edge Functions. If this fails, please switch to port 465 (Implicit TLS) in your secrets.",
            );
        }

        const client = new SMTPClient({
            connection: {
                hostname: SMTP_HOST,
                port: SMTP_PORT,
                tls: isImplicitTLS, // Implicit TLS for 465, STARTTLS for others
                auth: {
                    username: SMTP_USERNAME,
                    password: SMTP_PASSWORD,
                },
            },
            debug: {
                log: true,
            },
        });

        console.log(
            `Initialising SMTP connection to ${SMTP_HOST}:${SMTP_PORT} using ${
                isImplicitTLS ? "Implicit TLS" : "STARTTLS"
            }...`,
        );

        // Send email
        await client.send({
            from: `${FROM_NAME} <${SMTP_USERNAME}>`,
            to: toEmail,
            subject: subject,
            content: "auto",
            html: htmlContent,
        });

        console.log(`Email successfully sent to ${toEmail}`);
        return true;
    } catch (error: any) {
        console.error("❌ SMTP Error:", error.message || error);
        if (
            error.message?.includes("BadResource") ||
            error.message?.includes("invalid cmd")
        ) {
            console.error(
                "💡 TIP: This error often means port 587 is blocked. Try changing SMTP_PORT to 465 in your Supabase Dashboard > Edge Functions > Secrets.",
            );
        }
        return false;
    }
}

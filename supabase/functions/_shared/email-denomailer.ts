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

        const client = new SMTPClient({
            connection: {
                hostname: SMTP_HOST,
                port: SMTP_PORT,
                tls: SMTP_PORT === 465, // Use Implicit TLS for 465, STARTTLS for others (like 587)
                auth: {
                    username: SMTP_USERNAME,
                    password: SMTP_PASSWORD,
                },
            },
            debug: {
                log: true, // Enable logging for debugging connection issues
            },
        });

        console.log(
            `Attempting to send email via ${SMTP_HOST}:${SMTP_PORT} (STARTTLS)...`,
        );

        // Send email
        await client.send({
            from: `${FROM_NAME} <${SMTP_USERNAME}>`,
            to: toEmail,
            subject: subject,
            content: "auto",
            html: htmlContent,
        });

        // The client automatically closes after send or on process exit in Denomailer 1.6.0
        // but it's good practice to ensure it's handled if supported.
        // In this version, SMTPClient is a high-level API.

        console.log(`Email sent successfully via SMTP to ${toEmail}`);
        return true;
    } catch (error) {
        console.error("Error sending email via SMTP:", error);
        return false;
    }
}

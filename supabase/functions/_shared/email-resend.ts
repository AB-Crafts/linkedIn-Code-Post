// Email sending via Resend API
// This implementation is kept for future use
// To use: Set USE_SMTP=false and configure RESEND_API_KEY

import { Resend } from "npm:resend@4.0.0";

export async function sendEmailViaResend(
    toEmail: string,
    subject: string,
    htmlContent: string,
): Promise<boolean> {
    try {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ||
            "noreply@pushtopost.dev";
        const FROM_NAME = Deno.env.get("FROM_NAME") || "PushToPost Team";

        if (!RESEND_API_KEY) {
            console.warn("RESEND_API_KEY not configured");
            return false;
        }

        const resend = new Resend(RESEND_API_KEY);

        const { data: _data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [toEmail],
            subject: subject,
            html: htmlContent,
        });

        if (error) {
            console.error("Resend error:", error);
            return false;
        }

        console.log(`Email sent successfully via Resend to ${toEmail}`);
        return true;
    } catch (error) {
        console.error("Error sending email via Resend:", error);
        return false;
    }
}

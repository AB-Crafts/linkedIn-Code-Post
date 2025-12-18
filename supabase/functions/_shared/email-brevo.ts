// Email sending via Brevo API (HTTP)
// This replaces the SMTP implementation for better reliability in Edge Functions

export async function sendEmailViaBrevo(
    toEmail: string,
    subject: string,
    htmlContent: string,
): Promise<boolean> {
    try {
        const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
        const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "pushtopost@gmail.com";
        const FROM_NAME = Deno.env.get("FROM_NAME") || "PushToPost Team";

        if (!BREVO_API_KEY) {
            console.error("❌ BREVO_API_KEY not configured");
            return false;
        }

        console.log(`Sending email to ${toEmail} via Brevo API...`);

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    name: FROM_NAME,
                    email: FROM_EMAIL,
                },
                to: [
                    {
                        email: toEmail,
                    },
                ],
                subject: subject,
                htmlContent: htmlContent,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Brevo API Error:", errorData);
            return false;
        }

        const data = await response.json();
        console.log(
            `✅ Email sent successfully via Brevo. Message ID: ${data.messageId}`,
        );
        return true;
    } catch (error) {
        console.error("❌ Exception sending email via Brevo:", error);
        return false;
    }
}

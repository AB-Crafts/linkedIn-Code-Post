// Email sending via Denomailer (Deno-native SMTP client)
// This is the active implementation

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

        // Import denomailer - native Deno SMTP client
        const { SmtpClient } = await import(
            "https://deno.land/x/denomailer@1.6.0/mod.ts"
        );

        const client = new SmtpClient();
        // Connect using TLS (STARTTLS on port 587)
        await client.connectTLS({
            hostname: SMTP_HOST,
            port: SMTP_PORT,
            username: SMTP_USERNAME,
            password: SMTP_PASSWORD,
        });
        // Send email
        await client.send({
            from: `${FROM_NAME} <${SMTP_USERNAME}>`,
            to: toEmail,
            subject: subject,
            content: "auto",
            html: htmlContent,
        });

        // Close connection
        await client.close();

        console.log(`Email sent successfully via SMTP to ${toEmail}`);
        return true;
    } catch (error) {
        console.error("Error sending email via SMTP:", error);
        return false;
    }
}

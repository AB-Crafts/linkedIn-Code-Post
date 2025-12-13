#!/usr/bin/env node

/**
 * PushToPost - Waitlist Email Sender
 * Sends thank you emails to all waitlist subscribers using Resend
 */

require('dotenv').config();
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service role key for server-side
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@pushtopost.dev';
const FROM_NAME = process.env.FROM_NAME || 'PushToPost Team';

// Rate limiting configuration
const EMAILS_PER_BATCH = 10;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

// Validate environment variables
function validateConfig() {
    const errors = [];

    if (!RESEND_API_KEY) errors.push('RESEND_API_KEY is missing');
    if (!SUPABASE_URL) errors.push('SUPABASE_URL is missing');
    if (!SUPABASE_SERVICE_KEY) errors.push('SUPABASE_SERVICE_KEY is missing');
    if (!FROM_EMAIL) errors.push('FROM_EMAIL is missing');

    if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach(err => console.error(`   - ${err}`));
        console.error('\n💡 Please check your .env file and ensure all required variables are set.');
        process.exit(1);
    }
}

// Initialize clients
const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Load email template
function loadEmailTemplate() {
    const templatePath = path.join(__dirname, 'email-template.html');
    if (!fs.existsSync(templatePath)) {
        console.error('❌ Email template not found at:', templatePath);
        process.exit(1);
    }
    return fs.readFileSync(templatePath, 'utf-8');
}

// Fetch all emails from Supabase
async function fetchWaitlistEmails() {
    console.log('📥 Fetching emails from Supabase...');

    const { data, error } = await supabase
        .from('waitlist')
        .select('email, created_at')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('❌ Error fetching emails from Supabase:', error);
        throw error;
    }

    console.log(`✅ Found ${data.length} subscribers in waitlist`);
    return data;
}

// Send a single email
async function sendEmail(email, htmlTemplate) {
    try {
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [email],
            subject: '🎉 Thank You for Joining PushToPost!',
            html: htmlTemplate,
        });

        if (error) {
            console.error(`   ❌ Failed to send to ${email}:`, error.message);
            return { success: false, email, error: error.message };
        }

        console.log(`   ✅ Sent to ${email}`);
        return { success: true, email, messageId: data.id };
    } catch (error) {
        console.error(`   ❌ Exception sending to ${email}:`, error.message);
        return { success: false, email, error: error.message };
    }
}

// Delay function for rate limiting
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Send emails in batches with rate limiting
async function sendAllEmails(subscribers, htmlTemplate, testMode = false, testEmail = null) {
    const results = {
        total: subscribers.length,
        sent: 0,
        failed: 0,
        errors: []
    };

    // Test mode: send to a single test email
    if (testMode) {
        if (!testEmail) {
            console.error('❌ Test mode requires a test email address');
            console.error('Usage: node send-emails.js --test your@email.com');
            process.exit(1);
        }

        console.log('\n🧪 TEST MODE: Sending to', testEmail);
        console.log('─'.repeat(50));

        const result = await sendEmail(testEmail, htmlTemplate);

        if (result.success) {
            console.log('\n✅ Test email sent successfully!');
            console.log('📧 Check your inbox and verify the email looks good.');
            console.log('💡 If everything looks good, run without --test flag to send to all subscribers.');
        } else {
            console.log('\n❌ Test email failed. Please check the error above.');
        }

        return results;
    }

    // Production mode: send to all subscribers
    console.log('\n📧 Starting email campaign...');
    console.log('─'.repeat(50));
    console.log(`Total subscribers: ${subscribers.length}`);
    console.log(`Batch size: ${EMAILS_PER_BATCH}`);
    console.log(`Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
    console.log('─'.repeat(50));

    // Process in batches
    for (let i = 0; i < subscribers.length; i += EMAILS_PER_BATCH) {
        const batch = subscribers.slice(i, i + EMAILS_PER_BATCH);
        const batchNumber = Math.floor(i / EMAILS_PER_BATCH) + 1;
        const totalBatches = Math.ceil(subscribers.length / EMAILS_PER_BATCH);

        console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (${batch.length} emails):`);

        // Send all emails in the batch concurrently
        const batchResults = await Promise.all(
            batch.map(subscriber => sendEmail(subscriber.email, htmlTemplate))
        );

        // Count results
        batchResults.forEach(result => {
            if (result.success) {
                results.sent++;
            } else {
                results.failed++;
                results.errors.push(result);
            }
        });

        // Show progress
        const progress = ((i + batch.length) / subscribers.length * 100).toFixed(1);
        console.log(`   Progress: ${results.sent}/${subscribers.length} sent (${progress}%)`);

        // Delay before next batch (except for the last batch)
        if (i + EMAILS_PER_BATCH < subscribers.length) {
            await delay(DELAY_BETWEEN_BATCHES);
        }
    }

    return results;
}

// Main function
async function main() {
    console.log('🚀 PushToPost Email Sender');
    console.log('═'.repeat(50));

    // Check for test mode
    const args = process.argv.slice(2);
    const testMode = args.includes('--test');
    const testEmail = testMode ? args[args.indexOf('--test') + 1] : null;

    // Validate configuration
    validateConfig();

    // Load email template
    const htmlTemplate = loadEmailTemplate();
    console.log('✅ Email template loaded');

    // Fetch subscribers
    const subscribers = await fetchWaitlistEmails();

    if (subscribers.length === 0) {
        console.log('⚠️  No subscribers found in waitlist');
        return;
    }

    // Send emails
    const results = await sendAllEmails(subscribers, htmlTemplate, testMode, testEmail);

    // Display final results
    if (!testMode) {
        console.log('\n' + '═'.repeat(50));
        console.log('📊 Campaign Results:');
        console.log('─'.repeat(50));
        console.log(`Total subscribers: ${results.total}`);
        console.log(`✅ Successfully sent: ${results.sent}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log('═'.repeat(50));

        if (results.failed > 0) {
            console.log('\n⚠️  Failed emails:');
            results.errors.forEach(err => {
                console.log(`   - ${err.email}: ${err.error}`);
            });
        }

        console.log('\n✨ Email campaign completed!');
        console.log('💡 Check your Resend dashboard for delivery analytics');
    }
}

// Run the script
main().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});

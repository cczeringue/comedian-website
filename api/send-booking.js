// Serverless function to handle booking form submissions
// This file keeps the email address server-side only
// Works with Vercel, Netlify Functions, or similar serverless platforms

// IMPORTANT: Set these environment variables in your hosting platform:
// - EMAIL_SERVICE_API_KEY (for your email service)
// - RECIPIENT_EMAIL (your email address - set in environment variables, not in code)

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'calebzeringue@gmail.com';

// Using nodemailer with a service like SendGrid, Mailgun, or SMTP
// For a simple solution, you can use a service like Formspree, EmailJS, or Web3Forms
// This example uses a generic email service approach

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers (adjust origin for your domain)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        const { name, email, location, message } = req.body;

        // Validate required fields
        if (!name || !email || !location) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Here you would integrate with your email service
        // Example using SendGrid, Mailgun, or similar:
        /*
        const emailService = require('@sendgrid/mail');
        emailService.setApiKey(process.env.EMAIL_SERVICE_API_KEY);
        
        const msg = {
            to: RECIPIENT_EMAIL,
            from: 'noreply@yourdomain.com',
            subject: `Booking Request from ${name}`,
            text: `
                New Booking Request:
                
                Name: ${name}
                Email: ${email}
                Location: ${location}
            `,
            html: `
                <h2>New Booking Request</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Location:</strong> ${location}</p>
            `
        };
        
        await emailService.send(msg);
        */

        // For now, return success (you'll need to implement actual email sending)
        // See README.md for setup instructions
        return res.status(200).json({ 
            success: true, 
            message: 'Booking request received successfully!' 
        });

    } catch (error) {
        console.error('Error processing booking request:', error);
        return res.status(500).json({ 
            error: 'Failed to process booking request' 
        });
    }
}


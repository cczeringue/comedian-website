# Booking Form Backend Setup

This serverless function handles booking form submissions and sends emails without exposing your email address in the frontend code.

## Setup Options

### Option 1: Use Formspree (Easiest - Recommended)

1. Go to https://formspree.io and create a free account
2. Create a new form and get your form endpoint URL
3. Update `script.js` to use the Formspree endpoint instead of `/api/send-booking`
4. Set your email address in Formspree's dashboard (kept server-side)

### Option 2: Use EmailJS (Client-side but configurable)

1. Go to https://www.emailjs.com and create an account
2. Set up an email service (Gmail, Outlook, etc.)
3. Create an email template
4. Get your service ID, template ID, and public key
5. Update `script.js` to use EmailJS (see commented code)

### Option 3: Deploy Serverless Function

#### For Vercel:
1. Install dependencies: `npm install @sendgrid/mail` (or your email service)
2. Set environment variables in Vercel dashboard:
   - `RECIPIENT_EMAIL` = your email address
   - `EMAIL_SERVICE_API_KEY` = your email service API key
3. Deploy to Vercel - the function will be available at `/api/send-booking`

#### For Netlify:
1. Create `netlify/functions/send-booking.js` (similar structure)
2. Set environment variables in Netlify dashboard
3. Deploy to Netlify

#### For Other Platforms:
- Adapt the function structure to your platform's serverless function format
- Set environment variables for your email address and API keys

## Security Notes

- Never commit your email address or API keys to version control
- Always use environment variables for sensitive data
- Consider adding rate limiting to prevent spam
- Add reCAPTCHA for additional spam protection


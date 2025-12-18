# Booking Form Setup Instructions

The booking form is ready to use! You have several options to set it up:

## Option 1: Web3Forms (Easiest - Recommended) ⭐

1. Go to https://web3forms.com
2. Enter your email: `calebzeringue@gmail.com`
3. Get your Access Key (they'll email it to you)
4. Open `script.js` and find the booking form handler
5. Replace `YOUR_ACCESS_KEY_HERE` with your actual access key
6. The form will work immediately - your email stays hidden!

## Option 2: Formspree

1. Go to https://formspree.io and sign up (free tier available)
2. Create a new form
3. Set the recipient email to `calebzeringue@gmail.com` in Formspree dashboard
4. Copy your form endpoint URL (looks like: `https://formspree.io/f/YOUR_FORM_ID`)
5. In `script.js`, replace the fetch URL with your Formspree endpoint
6. Your email is kept server-side by Formspree

## Option 3: Serverless Function

If you're hosting on Vercel, Netlify, or similar:
1. The serverless function is already created in `/api/send-booking.js`
2. Set up an email service (SendGrid, Mailgun, etc.)
3. Set environment variables:
   - `RECIPIENT_EMAIL` = `calebzeringue@gmail.com`
   - `EMAIL_SERVICE_API_KEY` = your service API key
4. Deploy - the function will work automatically

## Current Status

The form HTML and styling are complete. You just need to choose one of the options above and configure it.

**Recommended: Use Web3Forms** - it's the fastest to set up and requires no backend code!


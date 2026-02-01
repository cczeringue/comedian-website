# 📲 Text-to-Shows Setup Guide

Add shows to your website by sharing event links from your phone. This guide walks you through the one-time setup.

## Quick Overview

1. Set up Vercel KV (free database)
2. Add environment variables
3. Create Apple Shortcut on your phone
4. Done! Share any event link → it appears on your site

---

## Step 1: Set Up Vercel KV (5 minutes)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **comedian-website** project
3. Go to **Storage** tab
4. Click **Create Database** → Select **KV**
5. Name it `shows-db` and click **Create**
6. Vercel will automatically add the KV environment variables to your project

## Step 2: Add Your API Key (2 minutes)

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `SHOWS_API_KEY`
   - **Value:** (make up a secret key, like `myshows2024secret`)
   - Save it somewhere safe - you'll need it for the shortcut

3. Click **Save**
4. **Redeploy** your site (go to Deployments → click the 3 dots → Redeploy)

## Step 3: Create Apple Shortcut (3 minutes)

This is the magic part - you'll be able to share any event link and it gets added automatically.

### Create the Shortcut:

1. Open **Shortcuts** app on your iPhone
2. Tap **+** to create new shortcut
3. Add these actions in order:

**Action 1: Receive input**
- Add "Receive **URLs** from **Share Sheet**"

**Action 2: Get URL**
- Add "Get URLs from **Shortcut Input**"

**Action 3: Send request**
- Add "Get Contents of URL"
- Tap on "URL" and enter: `https://YOUR-SITE.vercel.app/api/add-show`
- Tap **Show More**
- Change Method to: **POST**
- Add Header:
  - Key: `Authorization`
  - Value: `Bearer YOUR_API_KEY` (the key from Step 2)
- Add Header:
  - Key: `Content-Type`
  - Value: `application/json`
- Request Body: **JSON**
  - Add key: `url`
  - Value: tap and select **URLs** (the variable from Action 2)

**Action 4: Show result**
- Add "Show Result"
- Select **Contents of URL** from previous step

4. Name it "Add Show" and tap **Done**

### Use It:

1. Open any event page (Eventbrite, Dice, Facebook Events, etc.)
2. Tap the **Share** button
3. Scroll down and tap **Add Show**
4. You'll see a confirmation with the event details
5. Refresh your links page - the show appears!

---

## Alternative: Use Shortcuts from Messages

If you want to literally text the link:

1. Text yourself the event link
2. Long-press the link in Messages
3. Tap **Share**
4. Tap **Add Show**

---

## Managing Shows

### View all shows:
```
GET https://your-site.vercel.app/api/shows
```

### Delete a show:
```
DELETE https://your-site.vercel.app/api/delete-show?id=SHOW_ID
Authorization: Bearer YOUR_API_KEY
```

---

## Supported Platforms

The scraper automatically extracts event details from:

- ✅ **Eventbrite** (full support)
- ✅ **Dice.fm** (full support)
- ✅ **Facebook Events** (basic support)
- ✅ **Ticketmaster** (basic support)
- ✅ **SeeTickets** (basic support)
- ✅ **Any site with structured data** (JSON-LD or Open Graph)

---

## Troubleshooting

### "Unauthorized" error
- Check your API key matches exactly (including the `Bearer ` prefix)

### Show not appearing
- Wait 30 seconds and refresh - Vercel KV has slight delay
- Check the API response for error messages

### Wrong date/venue extracted
- Some sites have weird markup - you can manually edit shows via the API

### Need to clear all shows?
```bash
curl -X POST "https://your-site.vercel.app/api/shows" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "clear"}'
```

---

## How It Works

1. You share an event link
2. Shortcut sends it to `/api/add-show`
3. API scrapes the event page for name, date, venue, ticket link
4. Data is stored in Vercel KV
5. Your links page fetches from `/api/shows` and displays them
6. Past shows automatically hide (only upcoming shows display)

That's it! 🎉

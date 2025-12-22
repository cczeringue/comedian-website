# Deployment Guide: calebzeringue.com

This guide will help you deploy your website to calebzeringue.com using Netlify (recommended) or alternative hosting options.

## Option 1: Netlify (Recommended - Easiest) ⭐

### Step 1: Prepare Your Site
Your site is already ready! All files are in place.

### Step 2: Create Netlify Account
1. Go to https://www.netlify.com
2. Click "Sign up" (free account is fine)
3. Sign up with GitHub, Email, or Google

### Step 3: Deploy Your Site

**Method A: Drag & Drop (Quickest)**
1. Log into Netlify
2. Drag your entire `comedian-website` folder onto the Netlify dashboard
3. Netlify will automatically deploy it
4. You'll get a temporary URL like `random-name-123.netlify.app`

**Method B: Git Integration (Better for updates)**
1. Create a GitHub repository:
   - Go to https://github.com and create a new repository
   - Upload your files (or use Git commands)
2. In Netlify:
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your repository
   - Netlify will auto-detect settings and deploy

### Step 4: Connect Your Domain (calebzeringue.com)

1. In Netlify dashboard, go to your site
2. Click "Domain settings" → "Add custom domain"
3. Enter: `calebzeringue.com`
4. Netlify will show you DNS records to add

### Step 5: Update DNS at Porkbun

1. Log into your Porkbun account
2. Go to DNS settings for calebzeringue.com
3. Add/Update these DNS records:

**For the main domain (calebzeringue.com):**
- **Type**: A
- **Name**: @ (or leave blank)
- **Value**: Netlify's IP (Netlify will show you this - usually `75.2.60.5`)

**For www subdomain (www.calebzeringue.com):**
- **Type**: CNAME
- **Name**: www
- **Value**: Your Netlify site URL (e.g., `your-site-name.netlify.app`)

**Alternative - Use Netlify Nameservers (Easier):**
1. In Netlify, go to Domain settings
2. Click "Verify" next to your domain
3. Netlify will give you nameservers (like `dns1.p01.nsone.net`)
4. In Porkbun, change nameservers to Netlify's nameservers
5. Wait 24-48 hours for DNS to propagate

### Step 6: SSL Certificate
Netlify automatically provides free SSL certificates. Once DNS is set up, HTTPS will work automatically!

### Step 7: Set Up Booking Form
1. Follow the instructions in `SETUP_INSTRUCTIONS.md`
2. Get your Web3Forms access key
3. Update `script.js` with your access key
4. Redeploy (or it will auto-deploy if using Git)

---

## Option 2: Vercel (Alternative)

1. Go to https://vercel.com and sign up
2. Click "Add New Project"
3. Import your site (drag & drop or connect Git)
4. Add custom domain: `calebzeringue.com`
5. Update DNS at Porkbun with Vercel's DNS records
6. SSL is automatic

---

## Option 3: GitHub Pages (Free, but requires GitHub)

1. Create a GitHub repository
2. Upload your files
3. Go to Settings → Pages
4. Select main branch as source
5. Your site will be at `username.github.io/repo-name`
6. For custom domain:
   - Add `CNAME` file with `calebzeringue.com`
   - Update DNS at Porkbun with GitHub Pages IP: `185.199.108.153`

---

## Option 4: Porkbun Hosting (If Available)

If Porkbun offers web hosting:
1. Check your Porkbun dashboard for hosting options
2. Upload files via FTP or file manager
3. Point domain to hosting (usually automatic)

---

## Quick Checklist

- [ ] Choose hosting provider (Netlify recommended)
- [ ] Deploy your site
- [ ] Add custom domain in hosting dashboard
- [ ] Update DNS records at Porkbun
- [ ] Wait for DNS propagation (can take up to 48 hours)
- [ ] Test your site at calebzeringue.com
- [ ] Set up booking form (Web3Forms)
- [ ] Test the booking form

---

## Troubleshooting

**Domain not working?**
- DNS can take 24-48 hours to propagate
- Check DNS propagation: https://www.whatsmydns.net
- Make sure DNS records are correct in Porkbun

**HTTPS not working?**
- Netlify/Vercel provide free SSL automatically
- Wait for DNS to fully propagate first

**Need help?**
- Netlify docs: https://docs.netlify.com
- Porkbun support: Check their help center

---

## Recommended: Netlify + Web3Forms

This combination gives you:
- ✅ Free hosting
- ✅ Free SSL certificate
- ✅ Easy deployment
- ✅ Automatic HTTPS
- ✅ Easy domain management
- ✅ Hidden email address (via Web3Forms)

Good luck with your launch! 🚀



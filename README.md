# Comedian Website - Optimized for Social Media Growth & Bookings

A modern, mobile-first website designed to maximize Instagram and TikTok followers while increasing comedy bookings.

**🚀 NEW: Instant Show Management via iPhone!** Add shows from your phone in seconds using iOS Shortcuts + Google Sheets. [See setup guide →](README_SHOWS_SYSTEM.md)

## Features

### 🎯 Social Media Optimization
- **Prominent Social Links**: Instagram, TikTok, and YouTube links featured throughout
- **Social Feed Integration**: Ready for Instagram and TikTok feed embeds
- **Share Functionality**: Built-in social sharing capabilities
- **Mobile-First Design**: Optimized for mobile users (primary audience for TikTok/Instagram)

### 📅 Booking Optimization
- **Clear Call-to-Actions**: Multiple booking buttons throughout the site
- **Easy Contact Form**: Streamlined booking request form
- **Upcoming Shows Section**: Showcase your schedule prominently
- **Instant Show Updates**: Add shows from your iPhone in seconds ([Setup Guide](README_SHOWS_SYSTEM.md))
- **Testimonials**: Social proof to build trust with bookers

### 🎨 Modern Design
- **Gradient Animations**: Eye-catching visual effects
- **Smooth Scrolling**: Enhanced user experience
- **Responsive Layout**: Works perfectly on all devices
- **Fast Loading**: Optimized for performance

### 📊 Analytics Ready
- **Event Tracking**: Built-in click tracking for analytics
- **SEO Optimized**: Meta tags and semantic HTML
- **Newsletter Integration**: Email capture for audience building

## Setup Instructions

### 0. Set Up Show Management (Optional but Recommended) 📱

**Add shows to your website instantly from your iPhone!**

The website now supports instant show updates via iOS Shortcuts + Google Sheets. This means you can add shows from anywhere without touching code or waiting for deploys.

📖 **[Complete Setup Guide](README_SHOWS_SYSTEM.md)** - Full instructions (~20 min setup)

Quick overview:
1. Create a Google Sheet with your shows
2. Update `script.js` with your Sheet's CSV URL
3. Build iOS Shortcut to add shows from your phone
4. Share any event link → fills form → show appears instantly on website!

**Benefits:**
- ⚡ Instant updates (1-2 seconds)
- 📱 Add from your phone (no computer needed)
- 🔗 Works with any event platform (Eventbrite, Dice, Universe, etc.)
- ✅ No deploys needed

**Documentation:**
- [README_SHOWS_SYSTEM.md](README_SHOWS_SYSTEM.md) - Complete overview
- [SHOWS_SETUP_GUIDE.md](SHOWS_SETUP_GUIDE.md) - Detailed setup walkthrough
- [IOS_SHORTCUT_GUIDE.md](IOS_SHORTCUT_GUIDE.md) - Build the iOS Shortcut
- [GOOGLE_SHEET_FORMAT.md](GOOGLE_SHEET_FORMAT.md) - Sheet format reference
- [QUICK_START_SHOWS.md](QUICK_START_SHOWS.md) - Daily use quick reference

---

### 1. Customize Your Information

**Update `index.html`:**
- Replace "Your Name" with your actual name throughout the file
- Update social media URLs:
  - `https://instagram.com/yourusername`
  - `https://tiktok.com/@yourusername`
  - `https://youtube.com/@yourusername`
- Update contact information (email, phone)
- Add your actual show dates and venues
- Replace placeholder content with your real bio, press mentions, etc.

**Update `styles.css`:**
- Customize colors in the `:root` section if desired
- Adjust fonts if needed

**Update `script.js`:**
- Configure newsletter form submission (integrate with Mailchimp, ConvertKit, etc.)
- Configure booking form submission (integrate with your backend or form service)
- Add Instagram/TikTok feed embeds

### 2. Add Social Media Feeds

**Instagram Feed Options:**
1. **SnapWidget** (easiest): Sign up at snapwidget.com, create a widget, and add the embed code
2. **Instagram Basic Display API**: For more control (requires developer setup)
3. **EmbedSocial**: Another easy option at embedsocial.com

**TikTok Feed Options:**
1. **EmbedSocial**: Supports TikTok feeds
2. **TikTok Embed API**: Official TikTok embed solution
3. **Custom API Integration**: Use TikTok's API for more control

### 3. Set Up Forms

**Newsletter Form:**
- Option 1: Use a service like Mailchimp, ConvertKit, or MailerLite
- Option 2: Use Formspree or Netlify Forms
- Option 3: Connect to your own backend

**Booking Form:**
- Option 1: Use Formspree (free tier available)
- Option 2: Use Netlify Forms
- Option 3: Connect to your email (currently uses mailto:)
- Option 4: Integrate with a booking system like Calendly

### 4. Add Your Content

- **Photos**: Replace placeholder images with your professional photos
- **Videos**: Add your actual video embeds or links
- **Press Mentions**: Update with your actual press coverage
- **Testimonials**: Add real testimonials from venues and audiences
- **Stats**: Update follower counts and show statistics

### 5. Deploy Your Website

**Option 1: Netlify (Recommended)**
1. Push your code to GitHub
2. Connect to Netlify
3. Deploy automatically

**Option 2: Vercel**
1. Push to GitHub
2. Import to Vercel
3. Deploy

**Option 3: GitHub Pages**
1. Push to GitHub repository
2. Enable GitHub Pages in settings
3. Your site will be live at `username.github.io/repository-name`

**Option 4: Traditional Hosting**
- Upload files via FTP to your hosting provider

## SEO Optimization Tips

1. **Update Meta Tags**: Already included, but customize descriptions
2. **Add Alt Text**: Add alt attributes to all images
3. **Create a Sitemap**: Use a sitemap generator
4. **Submit to Google Search Console**: After deployment
5. **Add Schema Markup**: Consider adding JSON-LD for events

## Social Media Growth Strategies

1. **Cross-Promote**: Link website in Instagram/TikTok bios
2. **QR Codes**: Add QR codes on business cards linking to your site
3. **Email Signature**: Include website link in email signatures
4. **Regular Updates**: Keep shows and content updated
5. **Blog Section**: Consider adding a blog for SEO and engagement

## Analytics Setup

1. **Google Analytics**: Add GA4 tracking code
2. **Facebook Pixel**: If running ads
3. **Social Media Analytics**: Track referral traffic from social platforms

## Performance Tips

- Optimize images before uploading (use WebP format)
- Enable compression on your hosting provider
- Use a CDN for faster global loading
- Minimize custom JavaScript if adding more features

## Support & Customization

This is a fully customizable template. Feel free to:
- Add more sections
- Change color schemes
- Add animations
- Integrate with booking systems
- Add a blog
- Create a press kit page

## License

Free to use and modify for your personal or commercial projects.

---

**Need help?** The code is well-commented and follows modern web standards. Customize it to match your brand and personality!


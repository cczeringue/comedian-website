// Navigation
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Animated counter for stats
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString();
        }
    };

    updateCounter();
};

// Intersection Observer for stats animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            const target = parseInt(statNumber.getAttribute('data-target'));
            if (!statNumber.classList.contains('animated')) {
                statNumber.classList.add('animated');
                animateCounter(statNumber, target);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
    statsObserver.observe(stat);
});

// Newsletter form submission
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        
        // Here you would integrate with your email service (e.g., Mailchimp, ConvertKit)
        // For now, we'll just show an alert
        alert(`Thanks for subscribing! We'll send updates to ${email}`);
        newsletterForm.reset();
        
        // Example: Send to your backend or email service
        // fetch('/api/newsletter', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email })
        // });
    });
}

// Booking form submission
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(bookingForm);
        const data = Object.fromEntries(formData);
        
        // Here you would send the booking request to your backend
        // For now, we'll create a mailto link
        const subject = encodeURIComponent(`Booking Request - ${data['event-type']}`);
        const body = encodeURIComponent(`
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'N/A'}
Event Type: ${data['event-type']}
Date: ${data.date || 'TBD'}
Venue: ${data.venue || 'TBD'}

Message:
${data.message || 'No message provided'}
        `);
        
        window.location.href = `mailto:booking@calebzeringue.com?subject=${subject}&body=${body}`;
        
        // Or use a form service like Formspree, Netlify Forms, etc.
        // fetch('/api/booking', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });
    });
}

// Add Instagram feed embed
// Replace with your actual Instagram embed code or use a service like SnapWidget
function loadInstagramFeed() {
    const instagramFeed = document.getElementById('instagramFeed');
    if (instagramFeed) {
        // Example: Using SnapWidget (you'll need to sign up and get your widget code)
        // const widget = document.createElement('script');
        // widget.src = 'https://snapwidget.com/js/snapwidget.js';
        // document.body.appendChild(widget);
        
        // Or use Instagram Basic Display API
        // fetch('YOUR_INSTAGRAM_API_ENDPOINT')
        //     .then(response => response.json())
        //     .then(data => {
        //         // Render Instagram posts
        //     });
    }
}

// Add TikTok feed embed
// Replace with your actual TikTok embed code or use a service like EmbedSocial
function loadTikTokFeed() {
    const tiktokFeed = document.getElementById('tiktokFeed');
    if (tiktokFeed) {
        // Example: Using EmbedSocial or similar service
        // const script = document.createElement('script');
        // script.src = 'YOUR_TIKTOK_EMBED_SCRIPT';
        // document.body.appendChild(script);
    }
}

// Bandsintown API Integration
const BANDSINTOWN_APP_ID = '7d484c532710ba981af4e93708fee931';
const ARTIST_NAME = 'Caleb Zeringue'; // Try artist name first, fallback to ID if needed

// Format date for show cards (e.g., "15 MAR")
function formatShowDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
}

// Format time from datetime string
function formatShowTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// Format location string
function formatLocation(venue) {
    const parts = [];
    if (venue.city) parts.push(venue.city);
    if (venue.region) parts.push(venue.region);
    if (venue.country && venue.country !== 'United States') parts.push(venue.country);
    return parts.join(', ');
}

// Create show card HTML element
function createShowCard(event) {
    const { day, month } = formatShowDate(event.datetime);
    const time = formatShowTime(event.datetime);
    const location = formatLocation(event.venue);
    const ticketUrl = event.offers && event.offers.length > 0 && event.offers[0].url 
        ? event.offers[0].url 
        : '#contact';
    const isSoldOut = event.offers && event.offers.length > 0 && event.offers[0].status === 'sold out';
    
    const card = document.createElement('div');
    card.className = 'show-card';
    card.innerHTML = `
        <div class="show-date">
            <span class="date-day">${day}</span>
            <span class="date-month">${month}</span>
        </div>
        <div class="show-info">
            <h3>${event.venue.name || 'Venue TBA'}</h3>
            <p class="show-location">📍 ${location || 'Location TBA'}</p>
            <p class="show-time">${time}</p>
        </div>
        <a href="${ticketUrl}" 
           class="btn btn-outline" 
           ${ticketUrl !== '#contact' ? 'target="_blank" rel="noopener noreferrer"' : ''}>
            ${isSoldOut ? 'Sold Out' : 'Get Tickets'}
        </a>
    `;
    return card;
}

// Fetch events from Bandsintown API
async function loadBandsintownEvents() {
    const showsGrid = document.getElementById('showsGrid');
    if (!showsGrid) return;
    
    // Show loading state
    showsGrid.innerHTML = '<div class="loading-shows">Loading shows...</div>';
    
    try {
        // Try with artist name first
        let apiUrl = `https://rest.bandsintown.com/artists/${encodeURIComponent(ARTIST_NAME)}/events?app_id=${BANDSINTOWN_APP_ID}&date=upcoming`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            // If artist name doesn't work, try with the ID from widget
            if (response.status === 404) {
                apiUrl = `https://rest.bandsintown.com/artists/id_15606262/events?app_id=${BANDSINTOWN_APP_ID}&date=upcoming`;
                const retryResponse = await fetch(apiUrl);
                if (!retryResponse.ok) {
                    throw new Error('Failed to fetch events');
                }
                const events = await retryResponse.json();
                renderEvents(events, showsGrid);
                return;
            }
            throw new Error('Failed to fetch events');
        }
        
        const events = await response.json();
        renderEvents(events, showsGrid);
        
    } catch (error) {
        console.error('Error loading Bandsintown events:', error);
        showsGrid.innerHTML = `
            <div class="no-shows">
                <p>Unable to load upcoming shows at this time.</p>
                <p class="small-text">Check back soon or <a href="#contact">contact us</a> for booking information.</p>
            </div>
        `;
    }
}

// Render events to the shows grid
function renderEvents(events, container) {
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="no-shows">
                <p>No upcoming shows scheduled at this time.</p>
                <p class="small-text">Check back soon or <a href="#contact">book me for your event</a>!</p>
            </div>
        `;
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Create and append show cards
    events.forEach(event => {
        const card = createShowCard(event);
        container.appendChild(card);
    });
    
    // Re-initialize fade-in animations for new cards
    const newCards = container.querySelectorAll('.show-card');
    newCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeObserver.observe(card);
    });
}

// Initialize feeds when page loads
window.addEventListener('DOMContentLoaded', () => {
    loadInstagramFeed();
    loadTikTokFeed();
    loadBandsintownEvents();
});

// Add fade-in animation on scroll
const fadeElements = document.querySelectorAll('.show-card, .video-card, .testimonial-card');
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

fadeElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(element);
});

// Parallax effect removed - using standard scroll behavior

// Social media share functionality
function shareOnSocial(platform, url, text) {
    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}

// Add click tracking for analytics (replace with your analytics service)
function trackEvent(category, action, label) {
    // Google Analytics example:
    // gtag('event', action, {
    //     'event_category': category,
    //     'event_label': label
    // });
    
    console.log('Event tracked:', { category, action, label });
}

// Track button clicks
document.querySelectorAll('.btn, .social-link').forEach(button => {
    button.addEventListener('click', () => {
        const label = button.textContent.trim() || button.getAttribute('aria-label');
        trackEvent('engagement', 'click', label);
    });
});


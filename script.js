// Navigation
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

// Navbar scroll effect — reveal brand when hero name scrolls out of view
// Mobile sticky CTA — show when scrolled past hero
const handleScroll = () => {
    const stickyHeader = document.getElementById('sticky-header');
    const heroSection = document.querySelector('.hero');
    
    // Trigger shrink effect almost immediately
    const threshold = 50;
    
    const heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : 400;

    if (window.scrollY > threshold) {
        stickyHeader.classList.add('scrolled');
    } else {
        stickyHeader.classList.remove('scrolled');
    }
    const mobileSticky = document.getElementById('mobileStickyCta');
    if (mobileSticky && window.innerWidth <= 1024) {
        if (window.scrollY > heroBottom) {
            mobileSticky.classList.add('visible');
        } else {
            mobileSticky.classList.remove('visible');
        }
    } else if (mobileSticky) {
        mobileSticky.classList.remove('visible');
    }
};

window.addEventListener('scroll', handleScroll);
// Also run on load to set initial state
    window.addEventListener('DOMContentLoaded', handleScroll);

    // 3D Tilt Effect
    const cards = document.querySelectorAll('.video-card, .show-card, .special-card, .featured-card, .project-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

window.addEventListener('resize', () => {
    const mobileSticky = document.getElementById('mobileStickyCta');
    if (mobileSticky && window.innerWidth > 1024) {
        mobileSticky.classList.remove('visible');
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

// Press section tabs (Luigi the Musical | The Drill Master)
document.querySelectorAll('.press-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-press-tab');
        if (!target) return;
        document.querySelectorAll('.press-tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.press-panel').forEach(panel => {
            panel.classList.remove('active');
            panel.hidden = true;
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.getElementById('press-panel-' + target);
        if (panel) {
            panel.classList.add('active');
            panel.hidden = false;
        }
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

// Booking form submission
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formMessage = document.getElementById('form-message');
        const submitButton = bookingForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // Get form data
        const formData = new FormData(bookingForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
        // Show sending state
        formMessage.style.display = 'block';
        formMessage.className = 'form-message sending';
        formMessage.textContent = 'Sending your booking request...';
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        try {
            // Option 1: Web3Forms (Recommended - Easy setup, email hidden)
            // Get your access key from https://web3forms.com
            // Replace YOUR_ACCESS_KEY_HERE with your actual access key
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_key: '7e877764-b77e-4963-aa66-269f5dc26ed2',
                    subject: data.subject || `Booking Request from ${data.name}`,
                    from_name: data.name,
                    from_email: data.email,
                    name: data.name,
                    email: data.email,
                    subject_field: data.subject,
                    message: data.message,
                    // Web3Forms will send to the email you configure in their dashboard
                })
            });
            
            // Option 2: Use your own serverless function (uncomment below)
            /*
            const response = await fetch('/api/send-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            */
            
            // Option 3: Use Formspree (uncomment and replace YOUR_FORM_ID)
            /*
            const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            */
            
            const result = await response.json();
            
            // Web3Forms returns success in result.success
            // Formspree returns 200 status on success
            // Serverless function returns result.success
            if (response.ok && (result.success || response.status === 200)) {
                // Success
                formMessage.className = 'form-message success';
                formMessage.textContent = 'Thank you! Your booking request has been sent. I\'ll get back to you soon.';
                bookingForm.reset();
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            } else {
                throw new Error(result.message || result.error || 'Failed to send booking request');
            }
        } catch (error) {
            // Error handling
            console.error('Error submitting booking form:', error);
            formMessage.className = 'form-message error';
            formMessage.textContent = 'Sorry, there was an error sending your request. Please try again or contact me directly.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
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

// Hardcoded Shows - Easy to Manage
// 🎯 ADD YOUR SHOWS HERE:
const HARDCODED_SHOWS = [
  {
    id: 'bits-beats-feb-2026',
    title: 'Bits & Beats: Comedy and Disco!',
    date: '2026-02-12T19:00:00-08:00', // 7:00 PM PT
    venue: '995 Market St, 6th Fl, San Francisco',
    ticketUrl: 'https://partiful.com/e/MMU9dzYqlZ5KedusCOqm',
    time: '7:00 PM',
    soldOut: false
  }
  // Add more shows here in the same format
];

// Format date for show cards (e.g., "15 MAR")
function formatShowDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
}

// Format time from datetime string or time string
function formatShowTime(timeString) {
    // If it's already in "7:00 PM" format, return it
    if (timeString && timeString.includes('PM') || timeString.includes('AM')) {
        return timeString;
    }
    // Otherwise parse as date
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// Create show card HTML element (updated for Google Sheets format)
function createShowCard(show) {
    const { day, month } = formatShowDate(show.date);
    const time = show.time || '';
    const ticketUrl = show.ticketUrl || '#contact';
    const isSoldOut = show.soldOut === 'TRUE' || show.soldOut === true;
    
    const card = document.createElement('div');
    card.className = 'show-card';
    card.innerHTML = `
        <div class="show-date">
            <span class="date-day">${day}</span>
            <span class="date-month">${month}</span>
        </div>
        <div class="show-info">
            <h3>${show.title || 'Show TBA'}</h3>
            <p class="show-location">📍 ${show.venue || 'Location TBA'}</p>
            ${time ? `<p class="show-time">${time}</p>` : ''}
        </div>
        <a href="${ticketUrl}" 
           class="btn btn-outline" 
           ${ticketUrl !== '#contact' ? 'target="_blank" rel="noopener noreferrer"' : ''}>
            ${isSoldOut ? 'Sold Out' : 'Get Tickets'}
        </a>
    `;
    return card;
}

// Load shows from hardcoded array
function loadHardcodedShows() {
    const showsGrid = document.getElementById('showsGrid');
    if (!showsGrid) return;
    
    // Show loading state
    showsGrid.innerHTML = '<div class="loading-shows">Loading shows...</div>';
    
    try {
        // Filter out past shows and sort by date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingShows = HARDCODED_SHOWS.filter(show => {
            const showDate = new Date(show.date);
            return showDate >= today;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        renderShows(upcomingShows, showsGrid);
        
    } catch (error) {
        console.error('Error loading shows:', error);
        showsGrid.innerHTML = `
            <div class="no-shows">
                <p>Unable to load upcoming shows at this time.</p>
                <p class="small-text">Check back soon or <a href="#contact">contact me</a> for booking information.</p>
            </div>
        `;
    }
}

// Render shows to the shows grid
function renderShows(shows, container) {
    if (!shows || shows.length === 0) {
        container.innerHTML = `
            <div class="no-shows">
                <p>Happy Holidays! Enjoying a break, 2026 dates coming soon.</p>
                <p class="small-text">Check back soon or <a href="#contact">book me for your event</a>!</p>
            </div>
        `;
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Create and append show cards
    shows.forEach(show => {
        const card = createShowCard(show);
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
    loadHardcodedShows(); // Loads shows from HARDCODED_SHOWS array
});

// Add fade-in animation on scroll for cards
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

// Scroll-triggered fade-in for section-level content
const sectionFadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
    '.section-title, .section-subtitle, .about-content, .videos-grid, .social-feeds, .media-interviews-carousel, .booking-form, .contact-content, .trust-bar .press-logos'
).forEach(el => {
    el.classList.add('fade-in-section');
    sectionFadeObserver.observe(el);
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
        if (label) trackEvent('engagement', 'click', label);
    });
});

// Media Interviews Carousel
const initMediaCarousel = () => {
    const carousel = document.getElementById('mediaCarousel');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!carousel || !prevBtn || !nextBtn || !dotsContainer) return;
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;
    let currentIndex = 0;
    
    // Calculate slide width (50% for 2 visible items)
    const getSlideWidth = () => {
        const container = carousel.parentElement;
        return (container.offsetWidth - 120) / 2; // Subtract padding
    };
    
    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        if (index === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    
    const updateCarousel = () => {
        const slideWidth = getSlideWidth();
        const gap = 32; // 2rem gap
        const translateX = currentIndex * (slideWidth + gap);
        carousel.style.transform = `translateX(-${translateX}px)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // Update button states
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= totalSlides - 2;
    };
    
    const goToSlide = (index) => {
        if (index < 0 || index > totalSlides - 2) return;
        currentIndex = index;
        updateCarousel();
    };
    
    const nextSlide = () => {
        if (currentIndex < totalSlides - 2) {
            currentIndex++;
            updateCarousel();
        }
    };
    
    const prevSlide = () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    };
    
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateCarousel, 250);
    });
    
    // Initialize
    updateCarousel();
    
    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });
};

// Truncate text to a specific character count
const truncateText = () => {
    const elements = document.querySelectorAll('.interview-preview, .interview-additional');
    const limit = 175;

    elements.forEach(element => {
        // Store original text if needed later (optional)
        if (!element.getAttribute('data-original-text')) {
            element.setAttribute('data-original-text', element.textContent.trim());
        }
        
        const text = element.getAttribute('data-original-text');
        if (text.length > limit) {
            element.textContent = text.slice(0, limit).trim() + '...';
        }
    });
};

// Initialize carousel and truncation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initMediaCarousel();
        truncateText();
    });
} else {
    initMediaCarousel();
    truncateText();
}


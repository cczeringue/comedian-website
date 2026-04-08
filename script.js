const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

const handleScroll = () => {
    const stickyHeader = document.getElementById('sticky-header');
    const heroSection = document.querySelector('.hero');
    const threshold = 50;
    const heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : 400;

    if (window.scrollY > threshold) {
        stickyHeader.classList.add('scrolled');
    } else {
        stickyHeader.classList.remove('scrolled');
    }

    const mobileSticky = document.getElementById('mobileStickyCta');
    if (mobileSticky && window.innerWidth <= 1024) {
        mobileSticky.classList.toggle('visible', window.scrollY > heroBottom);
    } else if (mobileSticky) {
        mobileSticky.classList.remove('visible');
    }
};

window.addEventListener('scroll', handleScroll);
window.addEventListener('DOMContentLoaded', handleScroll);

const cards = document.querySelectorAll('.project-feature, .press-media-card');
cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -5;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 5;
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

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        }
    });
});

const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formMessage = document.getElementById('form-message');
        const submitButton = bookingForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        const formData = new FormData(bookingForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        formMessage.style.display = 'block';
        formMessage.className = 'form-message sending';
        formMessage.textContent = 'Sending your request...';
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_key: '7e877764-b77e-4963-aa66-269f5dc26ed2',
                    subject: data.subject || `Booking Request from ${data.name}`,
                    from_name: data.name,
                    from_email: data.email,
                    name: data.name,
                    email: data.email,
                    subject_field: data.subject,
                    message: data.message,
                })
            });
            const result = await response.json();
            if (response.ok && (result.success || response.status === 200)) {
                formMessage.className = 'form-message success';
                formMessage.textContent = 'Thank you! Your request has been sent.';
                bookingForm.reset();
                setTimeout(() => { formMessage.style.display = 'none'; }, 5000);
            } else {
                throw new Error(result.message || 'Failed to send');
            }
        } catch (error) {
            console.error('Error:', error);
            formMessage.className = 'form-message error';
            formMessage.textContent = 'Sorry, there was an error. Please try again or contact me directly.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

const sectionFadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
    '.section-title, .section-subtitle, .about-content, .standup-featured, .standup-clips, .booking-form-element, .contact-layout, .trust-bar .press-logos, .projects-showcase, .proof-shell, .testimonials-rotator'
).forEach(el => {
    el.classList.add('fade-in-section');
    sectionFadeObserver.observe(el);
});

/* Testimonials rotator — add entries to TESTIMONIALS to enable auto-rotate + dots */
const TESTIMONIALS = [
    {
        quote: 'Smart, weird, and genuinely unpredictable. Caleb Zeringue is doing something fresh and it shows.',
        name: 'Lady Bushra',
        nameUrl: 'https://www.instagram.com/lady.bushra/',
        credential: 'shortlisted BBC Comic'
    }
];

function escapeTestimonialHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function initTestimonialsRotator() {
    const root = document.querySelector('[data-testimonials-rotator]');
    const track = root?.querySelector('[data-testimonials-track]');
    if (!root || !track || !TESTIMONIALS.length) return;

    track.innerHTML = TESTIMONIALS.map((t, i) => {
        const nameLink = `<a href="${escapeTestimonialHtml(t.nameUrl)}" target="_blank" rel="noopener noreferrer">${escapeTestimonialHtml(t.name)}</a>`;
        const cred = t.credential ? `, ${escapeTestimonialHtml(t.credential)}` : '';
        return `<blockquote class="testimonial-slide${i === 0 ? ' is-active' : ''}" data-testimonial-index="${i}" aria-hidden="${i !== 0}">
            <p class="testimonial-quote">${escapeTestimonialHtml(t.quote)}</p>
            <footer class="testimonial-attribution">&mdash; <cite class="testimonial-cite">${nameLink}${cred}</cite></footer>
        </blockquote>`;
    }).join('');
    track.hidden = false;

    const slides = () => [...track.querySelectorAll('.testimonial-slide')];
    if (slides().length <= 1) return;

    const dotsWrap = root.querySelector('[data-testimonials-dots]');
    const controls = root.querySelector('[data-testimonials-controls]');
    const prevBtn = root.querySelector('[data-testimonials-prev]');
    const nextBtn = root.querySelector('[data-testimonials-next]');
    let index = 0;
    let timer;

    const show = (next) => {
        const list = slides();
        const n = ((next % list.length) + list.length) % list.length;
        list.forEach((el, i) => {
            el.classList.toggle('is-active', i === n);
            el.setAttribute('aria-hidden', String(i !== n));
        });
        dotsWrap?.querySelectorAll('.testimonials-dot').forEach((btn, i) => {
            btn.setAttribute('aria-selected', String(i === n));
            btn.classList.toggle('is-active', i === n);
        });
        index = n;
    };

    controls.hidden = false;
    dotsWrap.innerHTML = TESTIMONIALS.map((_, i) =>
        `<button type="button" class="testimonials-dot${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${i === 0}" aria-label="Testimonial ${i + 1} of ${TESTIMONIALS.length}" data-dot="${i}"></button>`
    ).join('');

    dotsWrap.addEventListener('click', (e) => {
        const b = e.target.closest('[data-dot]');
        if (!b) return;
        show(Number.parseInt(b.dataset.dot, 10));
        resetTimer();
    });

    prevBtn?.addEventListener('click', () => {
        show(index - 1);
        resetTimer();
    });

    nextBtn?.addEventListener('click', () => {
        show(index + 1);
        resetTimer();
    });

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ROTATE_MS = 9000;

    function resetTimer() {
        clearInterval(timer);
        if (!prefersReduced) {
            timer = setInterval(() => show(index + 1), ROTATE_MS);
        }
    }

    resetTimer();
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', () => resetTimer());
}

initTestimonialsRotator();

document.querySelectorAll('.btn, .social-link').forEach(button => {
    button.addEventListener('click', () => {
        const label = button.textContent.trim() || button.getAttribute('aria-label');
        if (label) console.log('Event:', label);
    });
});

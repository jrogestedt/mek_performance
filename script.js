// Booking Modal
const bookingModal = document.getElementById('booking-modal');
const openBookingButtons = document.querySelectorAll('.open-booking-modal');
const closeBookingButton = document.querySelector('.booking-modal-close');
const bookingOverlay = document.querySelector('.booking-modal-overlay');
const bookingForm = document.getElementById('booking-form');

function openBookingModal() {
    if (bookingModal) {
        bookingModal.classList.add('active');
        bookingModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
}

function closeBookingModal() {
    if (bookingModal) {
        bookingModal.classList.remove('active');
        bookingModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

openBookingButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        openBookingModal();
    });
});

if (closeBookingButton) {
    closeBookingButton.addEventListener('click', closeBookingModal);
}

if (bookingOverlay) {
    bookingOverlay.addEventListener('click', closeBookingModal);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bookingModal && bookingModal.classList.contains('active')) {
        closeBookingModal();
    }
});

if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('booking-name').value.trim();
        const phone = document.getElementById('booking-phone').value.trim();
        const email = document.getElementById('booking-email').value.trim();
        const registration = document.getElementById('booking-regno').value.trim();
        const checkedServices = Array.from(bookingForm.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value);
        const extra = document.getElementById('booking-extra').value.trim();

        const apiBase = (typeof window.ALEX_BOOKING_API_URL !== 'undefined' && window.ALEX_BOOKING_API_URL)
            ? String(window.ALEX_BOOKING_API_URL).trim().replace(/\/$/, '')
            : '';
        const apiKey = (typeof window.ALEX_BOOKING_API_KEY !== 'undefined' && window.ALEX_BOOKING_API_KEY)
            ? String(window.ALEX_BOOKING_API_KEY).trim()
            : '';

        // Lead API spec: POST /api/lead, body { name, email, phone?, message? }
        const servicesText = checkedServices.length > 0 ? checkedServices.join(', ') : '';
        const messageParts = [
            registration && 'Registreringsnummer: ' + registration,
            servicesText && 'Önskade tjänster: ' + servicesText,
            extra && 'Ytterligare information: ' + extra
        ].filter(Boolean);
        const messageStr = messageParts.join('\n\n') || '';

        const leadPayload = {
            name: name,
            email: email
        };
        if (phone) leadPayload.phone = phone;
        if (messageStr) leadPayload.message = messageStr;

        if (apiBase && apiKey) {
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Skickar...';
            try {
                const res = await fetch(apiBase + '/api/lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey
                    },
                    body: JSON.stringify(leadPayload)
                });
                const data = await res.json().catch(function () { return {}; });
                if (res.ok) {
                    // Spec: 200 → { "status": "ok", "lead_id": 42 }
                    if (data.status === 'ok') {
                        alert('Tack! Vi återkommer till dig.');
                        closeBookingModal();
                        bookingForm.reset();
                    } else {
                        alert(data.detail || 'Något gick fel. Försök igen.');
                    }
                } else {
                    // Spec: errors have "detail" (string or validation array)
                    const detail = data.detail;
                    let msg = 'Något gick fel. Försök igen.';
                    if (res.status === 401) msg = 'Ogiltig konfiguration. Kontakta oss gärna direkt.';
                    else if (res.status === 429) msg = 'För många försök. Vänta en stund och försök igen.';
                    else if (typeof detail === 'string') msg = detail;
                    else if (Array.isArray(detail) && detail.length) msg = detail.map(function (d) { return d.msg || d.loc; }).filter(Boolean).join(' ') || msg;
                    alert(msg);
                }
            } catch (err) {
                console.error(err);
                fallbackMailto(name, phone, email, registration, checkedServices, extra);
                closeBookingModal();
                bookingForm.reset();
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } else {
            fallbackMailto(name, phone, email, registration, checkedServices, extra);
            closeBookingModal();
            bookingForm.reset();
        }
    });
}

function fallbackMailto(name, phone, email, registration, services, extra) {
    const servicesText = services.length > 0 ? services.join(', ') : '-';
    const subject = encodeURIComponent('Bokningsförfrågan från ' + name);
    const body = encodeURIComponent(
        'Namn: ' + name + '\n' +
        'Telefon: ' + phone + '\n' +
        'E-post: ' + email + '\n' +
        'Registreringsnummer: ' + (registration || '-') + '\n\n' +
        'Önskade tjänster: ' + servicesText + '\n\n' +
        'Ytterligare information:\n' + (extra || '-')
    );
    window.location.href = 'mailto:mek.performance@gmail.com?subject=' + subject + '&body=' + body;
}

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.nav');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-list a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all FAQ items
        faqItems.forEach(faqItem => {
            faqItem.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Gallery Lightbox (optional enhancement)
const galleryItems = document.querySelectorAll('.gallery-item');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) {
            // Create lightbox
            const lightbox = document.createElement('div');
            lightbox.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                cursor: pointer;
            `;
            
            const lightboxImg = document.createElement('img');
            lightboxImg.src = img.src;
            lightboxImg.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
            `;
            
            lightbox.appendChild(lightboxImg);
            document.body.appendChild(lightbox);
            
            lightbox.addEventListener('click', () => {
                document.body.removeChild(lightbox);
            });
        }
    });
});

// Scroll Indicator
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const aboutSection = document.querySelector('.about');
        if (aboutSection) {
            aboutSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
}

// Header scroll effect
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// Health check: test backend connection on page load
(function checkApiHealth() {
    const el = document.getElementById('api-health-status');
    const apiBase = (typeof window.ALEX_BOOKING_API_URL !== 'undefined' && window.ALEX_BOOKING_API_URL)
        ? String(window.ALEX_BOOKING_API_URL).trim().replace(/\/$/, '')
        : '';
    const apiKey = (typeof window.ALEX_BOOKING_API_KEY !== 'undefined' && window.ALEX_BOOKING_API_KEY)
        ? String(window.ALEX_BOOKING_API_KEY).trim()
        : '';

    function setStatus(text, ok) {
        if (el) {
            el.textContent = text;
            el.className = 'api-health-status ' + (ok ? 'api-health-ok' : 'api-health-fail');
        }
    }

    if (!apiBase || !apiKey) {
        setStatus('', false);
        return;
    }

    setStatus('API: Kontrollerar…', false);
    fetch(apiBase + '/health', {
        method: 'GET',
        headers: { 'X-API-Key': apiKey }
    })
        .then(function (res) {
            const ok = res.ok;
            return res.json().catch(function () { return {}; }).then(function (data) {
                if (ok && (data.status === 'up' || data.status === 'ok')) {
                    setStatus('API: Ansluten', true);
                    console.log('[Mek Performance] Backend health OK', data);
                } else {
                    setStatus('API: Ej ansluten', false);
                    console.warn('[Mek Performance] Backend health failed', res.status, data);
                }
            });
        })
        .catch(function (err) {
            setStatus('API: Ej ansluten', false);
            console.warn('[Mek Performance] Backend health error', err);
        });
})();

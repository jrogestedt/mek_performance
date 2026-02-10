// Booking Modal
const bookingModal = document.getElementById('booking-modal');
const openBookingButtons = document.querySelectorAll('.open-booking-modal');
const closeBookingButton = document.querySelector('#booking-modal .booking-modal-close');
const bookingOverlay = document.querySelector('#booking-modal .booking-modal-overlay');
const bookingForm = document.getElementById('booking-form');

// Feedback Modal (same design as Boka)
const feedbackModal = document.getElementById('feedback-modal');
const feedbackModalClose = document.querySelector('.feedback-modal-close');
const feedbackModalOverlay = document.querySelector('#feedback-modal .booking-modal-overlay');
const feedbackModalBtn = document.querySelector('.feedback-modal-btn');
const feedbackModalTitle = document.getElementById('feedback-modal-title');
const feedbackModalMessage = document.getElementById('feedback-modal-message');

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

function openFeedbackModal(title, message) {
    if (feedbackModal && feedbackModalTitle && feedbackModalMessage) {
        feedbackModalTitle.textContent = title;
        feedbackModalMessage.textContent = message;
        feedbackModal.classList.add('active');
        feedbackModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
}


function closeFeedbackModal() {
    if (feedbackModal) {
        feedbackModal.classList.remove('active');
        feedbackModal.setAttribute('aria-hidden', 'true');
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

if (feedbackModalClose) {
    feedbackModalClose.addEventListener('click', closeFeedbackModal);
}
if (feedbackModalOverlay) {
    feedbackModalOverlay.addEventListener('click', closeFeedbackModal);
}
if (feedbackModalBtn) {
    feedbackModalBtn.addEventListener('click', closeFeedbackModal);
}

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (serviceModal && serviceModal.classList.contains('active')) {
        closeServiceModal();
    } else if (feedbackModal && feedbackModal.classList.contains('active')) {
        closeFeedbackModal();
    } else if (bookingModal && bookingModal.classList.contains('active')) {
        closeBookingModal();
    }
});

if (bookingForm) {
    // Price per service (SEK) for possible_price (sum of ticked items → CRM Expected Revenue). Null = no fixed price (e.g. "Kontakta för offert").
    var bookingPriceMap = {
        'Steg 1': 4495,
        'Steg 2': null,
        'AdBlue off': 4995,
        'Decat': 1495,
        'DPF OFF': 2995,
        'Cylinder OFF': 1895,
        'EGR OFF': 1995,
        'Pops & Bangs': 2495,
        'Pops & Bangs med AV/PÅ': 3495,
        'Cold start Delete': 949,
        'Växellåda Steg 1': 3495,
        'Växellåda Steg 2': 3995,
        'Exteriör detailing': 2000,
        'Interiör detailing': 2000,
        'Lackkorrigering': 2000,
        'Keramiskt lackskydd': 2000,
        'Motorrestaurering': 2000
    };

    // Toggle Motoroptimering / Bilvård sub-options when category is checked/unchecked
    document.querySelectorAll('.booking-category-toggle').forEach(function (toggle) {
        toggle.addEventListener('change', function () {
            var category = this.getAttribute('data-category');
            var subgroup = document.getElementById('booking-subgroup-' + category);
            if (!subgroup) return;
            if (this.checked) {
                subgroup.classList.add('visible');
                subgroup.setAttribute('aria-hidden', 'false');
            } else {
                subgroup.classList.remove('visible');
                subgroup.setAttribute('aria-hidden', 'true');
                subgroup.querySelectorAll('input[name="services"]').forEach(function (cb) { cb.checked = false; });
                subgroup.querySelectorAll('.booking-option-row').forEach(function (row) { row.classList.remove('checked'); });
            }
        });
    });

    bookingForm.querySelectorAll('input[name="services"]').forEach(function (cb) {
        cb.addEventListener('change', function () {
            var row = this.closest('.booking-option-row');
            if (row) row.classList.toggle('checked', this.checked);
        });
    });

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

        // Lead API: name, email (required); phone?, message? (Notes), possible_price? (sum of ticked items → Expected Revenue), probability?, date_deadline?, extra_fields?
        const servicesText = checkedServices.length > 0 ? checkedServices.join(', ') : '';
        var totalPrice = 0;
        checkedServices.forEach(function (val) {
            var p = bookingPriceMap[val];
            if (typeof p === 'number') totalPrice += p;
        });
        const messageParts = [
            registration && ('Registreringsnummer: ' + registration),
            servicesText && ('Önskade tjänster: ' + servicesText),
            extra && ('Ytterligare information: ' + extra)
        ].filter(Boolean);
        const messageStr = messageParts.join('\n') || '';

        const leadPayload = {
            name: name,
            email: email
        };
        if (phone) leadPayload.phone = phone;
        if (messageStr) leadPayload.message = messageStr;
        if (totalPrice > 0) leadPayload.possible_price = totalPrice;
        var extraFields = {};
        if (registration) extraFields.x_studio_registration_number = registration;
        if (servicesText) extraFields.x_studio_desired_services = servicesText;
        if (Object.keys(extraFields).length > 0) leadPayload.extra_fields = extraFields;

        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Skickar...';

        try {
            if (!apiBase || !apiKey) {
                closeBookingModal();
                openFeedbackModal('Ett fel uppstod', 'Ett fel uppstod, var god försök igen.');
                return;
            }
            const res = await fetch(apiBase + '/api/lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify(leadPayload)
            });
            if (res.ok) {
                closeBookingModal();
                bookingForm.reset();
                openFeedbackModal('Tack', 'Tack för din förfrågan, vi återkommer inom 24h.');
            } else {
                closeBookingModal();
                openFeedbackModal('Ett fel uppstod', 'Ett fel uppstod, var god försök igen.');
            }
        } catch (err) {
            console.error(err);
            closeBookingModal();
            openFeedbackModal('Ett fel uppstod', 'Ett fel uppstod, var god försök igen.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Service cards – clickable, open flip popup with content
const serviceModal = document.getElementById('service-modal');
const serviceModalTitle = document.getElementById('service-modal-title');
const serviceModalGeneral = document.getElementById('service-modal-general');
const serviceModalIncludes = document.getElementById('service-modal-includes');
const serviceModalClose = document.querySelector('.service-modal-close');
const serviceModalOverlay = document.querySelector('.service-modal-overlay');

const serviceContent = {
    1: {
        title: 'Exteriör detailing',
        general: 'Exteriör detailing ger bilens kaross och lack en grundlig rengöring och skydd. Vi tar bort smuts, asfalt och föroreningar utan att skada lacken. Behandlingen förlänger bilens livslängd och ger ett fräscht, välskött utseende. Perfekt som årlig underhållsbehandling eller inför säsongsskifte.',
        includes: '<h4>Detta ingår</h4><ul><li>Avfettning</li><li>Vaxschampo</li><li>Rengöring</li><li>Asfaltsborttagning</li><li>Fälgrengöring</li><li>Avtorkning</li></ul>',
        price: '<h4>Pris från</h4><p class="service-modal-price">Från 2 000 kr</p>'
    },
    2: {
        title: 'Interiör detailing',
        general: 'Interiör detailing ger insidan av bilen en djuprengöring från tak till mattor. Vi når alla hörn och rengör materialen försiktigt så att de håller längre. En ren och fräsch interiör är trevligare att sitta i, minskar allergener och höjer bilens värde vid försäljning.',
        includes: '<h4>Detta ingår</h4><ul><li>Dammsugning</li><li>Invändig rengöring av mattor</li><li>Instrumentpanel</li><li>Fönster</li><li>Dörrfalsar samt fack</li></ul>',
        price: '<h4>Pris från</h4><p class="service-modal-price">Från 2 000 kr</p>'
    },
    3: {
        title: 'Polering',
        general: 'Polering tar bort repor och slitage från lacken genom att jämna ut ytan. Vi erbjuder tre steg så att du väljer rätt intensitet utifrån bilens skick. Ett polerat fordon reflekterar ljus bättre, ser nyare ut och är lättare att underhålla framöver.',
        includes: '<h4>Våra tre steg</h4><ul><li><strong>Steg 1</strong> – Utvändig tvätt och maskinvaxning. Passar bäst om bilen är ny och inte har fått några repor.</li><li><strong>Steg 2</strong> – Har bilen små repor som bara syns i solen är steg 2 ett bra val.</li><li><strong>Steg 3</strong> – Har bilen många eller djupa repor är steg 3 ett bra val.</li></ul>',
        price: '<h4>Pris från</h4><p class="service-modal-price">Kontakta oss för offert</p>'
    },
    4: {
        title: 'Lackförsegling',
        general: 'Lackförsegling är ett skydd för ny eller nypolerad lack. Det skyddar mot UV-strålning, smuts och vatten och gör bilen lättare att tvätta. Skicket håller längre och bilen ser välskött ut. Särskilt lämpligt för nya bilar eller efter polering.',
        includes: '<h4>Detta ingår</h4><ul><li>Lackskydd för ny bil (försegling som skyddar och förlänger glansen)</li></ul>',
        price: '<h4>Pris från</h4><p class="service-modal-price">Från 2 000 kr</p>'
    },
    5: {
        title: 'Motortvätt',
        general: 'Motortvätt rengör och skyddar motorutrymmet. Vi avfettar ytor och behandlar plastdetaljer så att de inte torkar ut eller slits. En ren motor är lättare att felsöka och visar att bilen är välskött. Kunden ansvarar för att motorn tål behandlingen.',
        includes: '<h4>Detta ingår</h4><ul><li>Avfettning</li><li>Behandling av plastdetaljer som förhindrar uttorkning och slitage</li></ul>',
        price: '<h4>Pris från</h4><p class="service-modal-price">Från 2 000 kr</p>'
    },
    6: {
        title: 'Motoroptimering',
        general: 'Motoroptimering justerar motorns parametrar för bättre effektivitet och respons. Det kan minska bränsleförbrukningen med 5–20 % beroende på bil och körstil. Du får ofta smidigare körbeteende och bättre körkänsla. Populärt bland både privatbilister och företag.',
        includes: '<h4>Effekt</h4><ul><li>Minskar bränsleförbrukning med 5–20 % beroende på bil</li></ul><h4>Möjliga tillägg och priser</h4><ul class="service-modal-price-list"><li>Steg 1: 4 495 kr</li><li>Steg 2: Kontakta för offert</li><li>AdBlue off: 4 995 kr</li><li>Cylinder OFF: 1 895 kr</li><li>Decat: från 1 495 kr</li><li>DPF OFF: från 2 995 kr</li><li>EGR OFF: 1 995 kr (995 kr vid optimering)</li><li>Pops &amp; Bangs: 2 495 kr</li><li>Pops &amp; Bangs med AV/PÅ: 3 495 kr</li><li>Cold start delete: 949 kr</li></ul>',
        price: ''
    }
};

function openServiceModal(serviceId) {
    const content = serviceContent[serviceId];
    if (!content || !serviceModal) return;
    serviceModalTitle.textContent = content.title;
    serviceModalGeneral.textContent = content.general;
    serviceModalIncludes.innerHTML = content.includes + (content.price ? content.price : '');
    serviceModal.classList.add('active');
    serviceModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeServiceModal() {
    if (serviceModal) {
        serviceModal.classList.remove('active');
        serviceModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

document.querySelectorAll('.service-card').forEach(function (card) {
    card.addEventListener('click', function () {
        const id = card.getAttribute('data-service');
        if (id) openServiceModal(id);
    });
    card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const id = card.getAttribute('data-service');
            if (id) openServiceModal(id);
        }
    });
});

if (serviceModalClose) serviceModalClose.addEventListener('click', closeServiceModal);
if (serviceModalOverlay) serviceModalOverlay.addEventListener('click', closeServiceModal);

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

// Google reviews: GET {API_BASE}/api/google-reviews (no auth). On 200: show rating, user_ratings_total, reviews.
// On 503 or failure: keep existing static fallback in HTML. Same API base as booking; CORS handled by backend.
// When opening as file (origin 'null'), skip fetch to avoid CORS errors; show hint to use a local server.
(function loadGoogleReviews() {
    var reviewsBase = (typeof window.ALEX_REVIEWS_API_URL !== 'undefined' && window.ALEX_REVIEWS_API_URL)
        ? String(window.ALEX_REVIEWS_API_URL).trim().replace(/\/$/, '')
        : '';
    if (!reviewsBase) return;
    var isFile = window.location.protocol === 'file:' || window.location.origin === 'null';
    if (isFile) {
        var cta = document.querySelector('.reviews-cta');
        if (cta) {
            var hint = document.createElement('p');
            hint.className = 'reviews-local-hint';
            hint.textContent = 'För att hämta recensioner från Google: öppna sidan via en lokal server (t.ex. npm start, sedan http://localhost:3000).';
            cta.parentNode.insertBefore(hint, cta);
        }
        return;
    }

    function escapeHtml(s) {
        if (typeof s !== 'string') return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function starsHtml(rating) {
        var n = typeof rating === 'number' && !isNaN(rating) ? Math.round(Math.max(0, Math.min(5, rating))) : 5;
        return '★'.repeat(n) + '☆'.repeat(5 - n);
    }

    fetch(reviewsBase + '/api/google-reviews', { method: 'GET' })
        .then(function (res) {
            if (!res.ok) return null; /* 503 or other error: keep static fallback */
            return res.json();
        })
        .then(function (data) {
            if (!data || (data.detail && !data.rating)) return;
            var scoreEl = document.getElementById('google-score-value');
            var labelEl = document.getElementById('google-score-label');
            var gridEl = document.getElementById('reviews-grid');
            if (!scoreEl || !labelEl || !gridEl) return;
            var rating = data.rating;
            var total = data.user_ratings_total;
            var reviews = data.reviews || [];
            if (typeof rating === 'number') {
                scoreEl.textContent = rating % 1 === 0 ? rating + ',0' : rating.toFixed(1).replace('.', ',');
            }
            if (typeof total === 'number') {
                labelEl.innerHTML = 'baserat på <strong>' + total + '</strong> recensioner på Google';
            }
            if (reviews.length > 0) {
                gridEl.innerHTML = reviews.map(function (r) {
                    var text = escapeHtml(r.text || '');
                    var author = escapeHtml(r.author_name || 'Google-användare');
                    var stars = starsHtml(r.rating);
                    var time = escapeHtml(r.relative_time_description || '');
                    var cite = time ? author + ' · ' + time : author;
                    return '<div class="review-card">' +
                        '<div class="review-stars" aria-hidden="true">' + stars + '</div>' +
                        (text ? '<blockquote class="review-quote">' + text + '</blockquote>' : '') +
                        '<cite class="review-author">— ' + cite + '</cite>' +
                        '</div>';
                }).join('');
            }
        })
        .catch(function () {});
})();

// Health check: test backend connection on page load.
// Skip when opening as file (origin 'null') to avoid CORS errors and console noise.
(function checkApiHealth() {
    const el = document.getElementById('api-health-status');
    const origin = window.location.origin;
    const isFile = window.location.protocol === 'file:';
    if (!origin || origin === 'null' || isFile) {
        if (el) el.textContent = '';
        return;
    }
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


import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const configured =
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_ANON_KEY.length > 20;

const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const defaults = [
  { id: 'haircut', name: 'Haircut', price: 2000, description: 'A clean, sharp cut.' },
  { id: 'haircut-dye', name: 'Haircut + Dye', price: 3000, description: 'A fresh cut with colour.' },
  { id: 'shape-up', name: 'Shape-up', price: 1000, description: 'A neat and precise finish.' },
  { id: 'tint', name: 'Tint', price: null, description: 'Ask us for a quote.' },
  { id: 'dreadlocks', name: 'Dreadlocks', price: null, description: 'Ask us for a quote.' },
  { id: 'hair-relaxer', name: 'Hair relaxer', price: null, description: 'Ask us for a quote.' },
  { id: 'beard-trim', name: 'Beard trim', price: null, description: 'Ask us for a quote.' },
  { id: 'hair-wash', name: 'Hair wash', price: null, description: 'Ask us for a quote.' },
  { id: 'haircut-beard', name: 'Haircut + beard', price: null, description: 'Ask us for a quote.' }
];

let services = defaults;
let gallery = [];
let currentSession = null;
let currentScreen = 0;

const screens = [
  'home',
  'services',
  'gallery',
  'book',
  'announcements',
  'contact'
];

const openingHours = { start: 9, end: 21 };
const app = document.querySelector('#app');

const money = n =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(n);

const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);


const dateToday = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const slotOptions = () => {
  const slots = [];

  for (let hour = openingHours.start; hour < openingHours.end; hour++) {
    for (const minute of [0, 30]) {
      slots.push(
        `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      );
    }
  }

  return slots;
};

const timeLabel = value => {
  const [hour, minute] = value.split(':').map(Number);
  return `${((hour + 11) % 12) + 1}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

function shell() {
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#home">MIZZY<span>CUTZ.</span></a>

      <nav class="main-nav">
        ${screens.map((screen, index) => `
          <button class="nav-link ${index === 0 ? 'active' : ''}"
            data-screen="${screen}">
            ${screen === 'book'
              ? 'Booking'
              : screen === 'announcements'
                ? 'News'
                : screen.charAt(0).toUpperCase() + screen.slice(1)}
          </button>
        `).join('')}
      </nav>

      <button class="nav-cta" data-screen="book">BOOK A CUT ↗</button>
    </header>

    <main class="screen-container">

      <section class="screen active" id="home" data-index="0">
        <div class="hero">
          <div class="hero-copy">
            <p class="eyebrow">MIZZY CUTZ · OPEN DAILY 9AM–9PM</p>
            <h1>LOOK GOOD.<br><em>FEEL GREAT.</em></h1>
            <p class="intro">
              Clean cuts, sharp details and fresh confidence.
              Experience the difference at MIZZY CUTZ.
            </p>

            <div class="hero-actions">
              <button class="button" data-screen="book">BOOK YOUR APPOINTMENT ↗</button>
              <button class="text-link" data-screen="services">EXPLORE SERVICES →</button>
            </div>

            <div class="hero-meta">
              <span>QUALITY SERVICE</span>
              <span>CLEAN FINISH</span>
              <span>GOOD ENERGY</span>
            </div>
          </div>

          <div class="hero-art">
            <img class="hero-photo"
              src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=85"
              alt="Professional barber haircut">
            <div class="art-caption">THE FRESH LOOK STARTS HERE.</div>
            <div class="art-stamp">MIZZY<br>CUTZ<br>✳</div>
          </div>
        </div>

        <div class="ticker">
          <span>FRESH CUTS</span><b>✳</b>
          <span>SHARP FINISH</span><b>✳</b>
          <span>GOOD ENERGY</span><b>✳</b>
          <span>MIZZY CUTZ</span>
        </div>

        <div class="home-bottom">
          <p class="eyebrow">YOUR STYLE. OUR CRAFT.</p>
          <h2>STAY FRESH.<br><em>STAY SHARP.</em></h2>
          <button class="button" data-screen="book">BOOK YOUR CUT ↗</button>
        </div>
      </section>

      <section class="screen" id="services" data-index="1">
        <div class="section">
          <div class="section-head">
            <div>
              <p class="eyebrow">WHAT WE DO</p>
              <h2>THE SERVICE<br><em>MENU.</em></h2>
            </div>
            <p class="section-note">Choose your service and book your appointment.</p>
          </div>
          <div id="service-grid" class="service-grid"></div>
        </div>
      </section>

      <section class="screen" id="gallery" data-index="2">
        <div class="section gallery-section">
          <div class="section-head">
            <div>
              <p class="eyebrow">THE WORK SPEAKS</p>
              <h2>FRESH FROM<br><em>THE CHAIR.</em></h2>
            </div>
            <p class="section-note">Swipe through styles from MIZZY CUTZ.</p>
          </div>
          <div id="gallery-grid" class="gallery-grid"></div>
        </div>
      </section>

      <section class="screen" id="book" data-index="3">
        <div class="booking-section">
          <div class="booking-intro">
            <p class="eyebrow">YOUR NEXT LOOK IS ONE BOOKING AWAY</p>
            <h2>BOOK YOUR<br><em>FRESH CUT.</em></h2>
            <p>Choose your service, appointment date and preferred time.</p>

            <div class="contact-card">
              <span>CALL / WHATSAPP</span>
              <strong>09029061551</strong>
              <span>PAYMENT</span>
              <strong>Optional deposit or pay after service.</strong>
              <span>OPENING HOURS</span>
              <strong>9AM – 9PM</strong>
            </div>
          </div>

          <form id="booking-form" class="booking-form">
            <h3>MAKE AN APPOINTMENT</h3>

            <label>Your name
              <input name="customer_name" required maxlength="80" placeholder="Full name">
            </label>

            <label>Phone number
              <input name="phone" required maxlength="20" placeholder="Your phone number">
            </label>

            <label>Email address
              <input name="customer_email" type="email" required maxlength="150"
                placeholder="Your email address">
            </label>

            <label>Choose a service
              <select name="service_id" id="booking-service" required></select>
            </label>

            <div class="form-row">
              <label>Date
                <input type="date" name="appointment_date" min="${dateToday()}" required>
              </label>

              <label>Time
                <select name="start_time" id="booking-time" required>
                  <option value="">Select date first</option>
                </select>
              </label>
            </div>

            <div class="location-heading">
              <p class="eyebrow">YOUR LOCATION</p>
              <p>These details help us know where to find you.</p>
            </div>

            <label>State
              <input name="customer_state" required maxlength="60" placeholder="e.g. Oyo">
            </label>

            <label>City / Town
              <input name="customer_city" required maxlength="80" placeholder="e.g. Ibadan">
            </label>

            <label>Street / Area
              <input name="customer_area" required maxlength="120" placeholder="Street or area">
            </label>

            <label>House address
              <textarea name="customer_address" required maxlength="250"
                placeholder="Enter your house address"></textarea>
            </label>

            <label>Google Maps location link (optional)
              <input name="maps_link" type="url" maxlength="300"
                placeholder="Paste a Google Maps link">
            </label>

            <label>Additional note (optional)
              <textarea name="note" maxlength="300"
                placeholder="Anything else we should know?"></textarea>
            </label>

            <button class="button full" type="submit">CONFIRM BOOKING ↗</button>
            <p class="form-hint">A deposit is optional. You can pay after service.</p>
            <div id="booking-message" aria-live="polite"></div>
          </form>
        </div>
      </section>

      <section class="screen" id="announcements" data-index="4">
        <div class="section">
          <p class="eyebrow">MIZZY CUTZ UPDATES</p>
          <h2>THE LATEST<br><em>NEWS.</em></h2>
          <p class="section-note">Announcements and updates from MIZZY CUTZ.</p>
          <div id="announcements-list" class="announcements-list">
            Loading announcements…
          </div>
        </div>
      </section>

      <section class="screen" id="contact" data-index="5">
        <div class="section contact-screen">
          <p class="eyebrow">STAY CONNECTED</p>
          <h2>FOLLOW <em>MIZZY CUTZ.</em></h2>
          <p>Follow our work, see fresh styles and contact us.</p>

          <div class="social-links">
            <a href="https://www.tiktok.com/@Mizzylivinglarge2x"
              target="_blank" rel="noopener noreferrer">TIKTOK ↗</a>
            <a href="https://wa.me/2349029061551"
              target="_blank" rel="noopener noreferrer">WHATSAPP ↗</a>
          </div>

          <div class="contact-card">
            <span>PHONE</span>
            <strong>09029061551</strong>
            <span>OPENING HOURS</span>
            <strong>Every day · 9AM–9PM</strong>
          </div>

          <button class="button" data-screen="book">BOOK YOUR CUT ↗</button>
        </div>
      </section>

    </main>

    <div class="screen-controls">
      <button id="previous-screen" aria-label="Previous screen">←</button>
      <div id="screen-dots">
        ${screens.map((screen, index) => `
          <button class="screen-dot ${index === 0 ? 'active' : ''}"
            data-screen="${screen}" aria-label="Go to ${screen}"></button>
        `).join('')}
      </div>
      <button id="next-screen" aria-label="Next screen">→</button>
    </div>

    <footer>
      <a class="brand" href="#home">MIZZY<span>CUTZ.</span></a>
      <span>© ${new Date().getFullYear()} MIZZY CUTZ. ALL RIGHTS RESERVED.</span>
      <button id="admin-open" class="admin-link">OWNER LOGIN</button>
    </footer>

    <div id="admin-modal" class="modal hidden">
      <div class="modal-card">
        <button class="close" id="admin-close" aria-label="Close">×</button>
        <div id="admin-content"></div>
      </div>
    </div>
  `;

  renderServices();
  bindNavigation();
  bindBooking();
  bindAdmin();
  renderGallery();
  renderAnnouncements();
}

function goToScreen(screen) {
  const index = screens.indexOf(screen);
  if (index < 0) return;

  currentScreen = index;

  document.querySelectorAll('.screen').forEach((element, i) => {
    element.classList.toggle('active', i === index);
  });

  document.querySelectorAll('[data-screen]').forEach(button => {
    button.classList.toggle('active', button.dataset.screen === screen);
  });

  document.querySelectorAll('.screen-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  document.querySelector('#previous-screen').disabled = index === 0;
  document.querySelector('#next-screen').disabled = index === screens.length - 1;

  history.replaceState(null, '', `#${screen}`);

  if (screen === 'announcements') renderAnnouncements();
}

function bindNavigation() {
  document.querySelectorAll('[data-screen]').forEach(button => {
    button.addEventListener('click', () => goToScreen(button.dataset.screen));
  });

  document.querySelector('#previous-screen').onclick = () => {
    if (currentScreen > 0) goToScreen(screens[currentScreen - 1]);
  };

  document.querySelector('#next-screen').onclick = () => {
    if (currentScreen < screens.length - 1) {
      goToScreen(screens[currentScreen + 1]);
    }
  };

  const container = document.querySelector('.screen-container');
  let startX = 0;
  let startY = 0;

  container.addEventListener('touchstart', event => {
    startX = event.changedTouches[0].screenX;
    startY = event.changedTouches[0].screenY;
  }, { passive: true });

  container.addEventListener('touchend', event => {
    const endX = event.changedTouches[0].screenX;
    const endY = event.changedTouches[0].screenY;
    const differenceX = endX - startX;
    const differenceY = endY - startY;

    if (Math.abs(differenceX) < 70 ||
        Math.abs(differenceX) < Math.abs(differenceY)) return;

    if (differenceX < 0 && currentScreen < screens.length - 1) {
      goToScreen(screens[currentScreen + 1]);
    } else if (differenceX > 0 && currentScreen > 0) {
      goToScreen(screens[currentScreen - 1]);
    }
  }, { passive: true });

  const initial = location.hash.replace('#', '');
  goToScreen(screens.includes(initial) ? initial : 'home');
}

function renderServices() {
  const grid = document.querySelector('#service-grid');
  const select = document.querySelector('#booking-service');

  if (!grid || !select) return;

  grid.innerHTML = services.map((service, index) => `
    <article class="service-card">
      <span class="service-no">${String(index + 1).padStart(2, '0')}</span>
      <div>
        <h3>${esc(service.name)}</h3>
        <p>${esc(service.description || 'Made fresh at MIZZY CUTZ.')}</p>
      </div>
      <strong>${service.price == null ? 'Price on request' : money(service.price)}</strong>
      <button class="small-button choose-service" data-service="${esc(service.id)}">
        BOOK THIS
      </button>
    </article>
  `).join('');

  select.innerHTML = '<option value="">Select a service</option>' +
    services.map(service => `
      <option value="${esc(service.id)}">
        ${esc(service.name)} — ${service.price == null ? 'Price on request' : money(service.price)}
      </option>
    `).join('');

  grid.querySelectorAll('.choose-service').forEach(button => {
    button.onclick = () => {
      select.value = button.dataset.service;
      goToScreen('book');
      select.focus();
    };
  });
}

async function renderGallery() {
  if (configured) {
    const { data, error } = await supabase
      .from('gallery')
      .select('id,caption,storage_path,created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      gallery = data.map(photo => ({
        ...photo,
        url: supabase.storage.from('gallery')
          .getPublicUrl(photo.storage_path).data.publicUrl
      }));
    }
  }

  const element = document.querySelector('#gallery-grid');
  if (!element) return;

  element.innerHTML = gallery.length
    ? gallery.map(photo => `
        <figure class="gallery-item">
          <img src="${esc(photo.url)}"
            alt="${esc(photo.caption || 'MIZZY CUTZ haircut')}"
            loading="lazy">
          <figcaption>${esc(photo.caption || 'MIZZY CUTZ')}</figcaption>
        </figure>
      `).join('')
    : `
      <div class="gallery-empty">
        <span>✳</span>
        <h3>YOUR NEXT CUT COULD BE HERE.</h3>
        <p>Our haircut gallery will appear here when photos are uploaded.</p>
      </div>
    `;
}

async function renderAnnouncements() {
  const element = document.querySelector('#announcements-list');
  if (!element) return;

  if (!configured) {
    element.textContent = 'Announcements are not available right now.';
    return;
  }

  const { data, error } = await supabase
    .from('customer_announcements')
    .select('id,title,message,created_at')
    .eq('status', 'sent')
    .order('created_at', { ascending: false });

  if (error) {
    element.textContent = 'Could not load announcements. Please try again later.';
    return;
  }

  element.innerHTML = data?.length
    ? data.map(item => `
        <article class="announcement-card">
          <p class="eyebrow">MIZZY CUTZ UPDATE</p>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.message).replace(/\n/g, '<br>')}</p>
          <small>${new Date(item.created_at).toLocaleDateString('en-NG')}</small>
        </article>
      `).join('')
    : '<p>No announcements yet. Check back soon.</p>';
}

function showPaymentChoices(booking) {
  const message = document.querySelector('#booking-message');

  message.innerHTML = `
    <div class="payment-panel">
      <h3>BOOKING REQUEST RECEIVED</h3>
      <p>Your booking request has been received. MIZZY CUTZ will review it.</p>
      <h3>HOW WOULD YOU LIKE TO PAY?</h3>
      <div class="payment-options">
        <button type="button" class="button" id="pay-now">
          I'VE TRANSFERRED
        </button>
        <button type="button" class="small-button" id="pay-later">
          I'LL PAY AFTER SERVICE
        </button>
      </div>
      <div id="payment-details"></div>
    </div>
  `;

  document.querySelector('#pay-later').onclick = () => {
    message.querySelector('#payment-details').innerHTML =
      '<p class="message success">No deposit needed. You can pay after your service.</p>';
  };

  document.querySelector('#pay-now').onclick = () => {
    message.querySelector('#payment-details').innerHTML = `
      <div class="payment-instructions">
        <h3>OPay TRANSFER DETAILS</h3>
        <p>Account name: <strong>Abdulmuheez Saheed Opeyemi</strong></p>
        <p>Account number: <strong>9126282831</strong></p>
        <p>Transfer your chosen amount, then upload your receipt below.</p>

        <form id="receipt-form">
          <label>Amount transferred (₦)
            <input name="amount" type="number" min="1" max="10000000"
              step="1" required placeholder="Enter amount">
          </label>

          <label>Upload transfer receipt
            <input name="receipt" type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf" required>
          </label>

          <button class="button full" type="submit">SUBMIT RECEIPT</button>
          <div id="receipt-message" aria-live="polite"></div>
        </form>
      </div>
    `;

    document.querySelector('#receipt-form').onsubmit = async event => {
      event.preventDefault();

      const form = event.currentTarget;
      const formData = new FormData(form);
      const amount = Number(formData.get('amount'));
      const file = formData.get('receipt');
      const receiptMessage = document.querySelector('#receipt-message');
      const submitButton = form.querySelector('[type="submit"]');

      if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) {
        receiptMessage.textContent = 'Enter a valid payment amount.';
        return;
      }

      if (!file || file.size > 5 * 1024 * 1024) {
        receiptMessage.textContent = 'Choose a receipt under 5 MB.';
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
      ];

      if (!allowedTypes.includes(file.type)) {
        receiptMessage.textContent = 'Use a JPG, PNG, WEBP or PDF receipt.';
        return;
      }

      submitButton.disabled = true;
      receiptMessage.textContent = 'Uploading your receipt…';

      try {
        const extension = file.name.split('.').pop().toLowerCase()
          .replace(/[^a-z0-9]/g, '');

        const path = `${booking.id}/${crypto.randomUUID()}.${extension}`;

        const upload = await supabase.storage
          .from('payment-receipts')
          .upload(path, file, { contentType: file.type });

        if (upload.error) throw upload.error;

        const submission = await supabase.rpc('submit_booking_payment', {
          p_booking_id: booking.id,
          p_amount: amount,
          p_receipt_path: path
        });

        if (submission.error) throw submission.error;

        receiptMessage.className = 'message success';
        receiptMessage.textContent =
          'Receipt submitted. Your payment is pending owner verification.';
        form.reset();
      } catch (error) {
        receiptMessage.className = 'message error';
        receiptMessage.textContent =
          `Receipt submission failed: ${error.message || 'Please try again.'}`;
      } finally {
        submitButton.disabled = false;
      }
    };
  };
}

function bindBooking() {
  const form = document.querySelector('#booking-form');
  const date = form.elements.appointment_date;
  const time = document.querySelector('#booking-time');

  date.addEventListener('change', async () => {
    time.innerHTML = '<option value="">Loading available times…</option>';

    if (!configured) {
      time.innerHTML = '<option value="">Website setup required</option>';
      return;
    }

    const { data, error } = await supabase.rpc('get_booked_slots', {
      p_appointment_date: date.value
    });

    if (error) {
      time.innerHTML = '<option value="">Could not load times</option>';
      return;
    }

    const taken = new Set(
      (data || []).map(item => String(item.start_time).slice(0, 5))
    );

    const available = slotOptions().filter(slot => !taken.has(slot));

    time.innerHTML = '<option value="">Choose a time</option>' +
      available.map(slot => `
        <option value="${slot}">${timeLabel(slot)}</option>
      `).join('');

    if (!available.length) {
      time.innerHTML =
        '<option value="">No slots available — choose another date</option>';
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const message = document.querySelector('#booking-message');

    if (!configured) {
      message.className = 'message error';
      message.textContent =
        'Online booking is not connected yet. Please contact MIZZY CUTZ.';
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const chosen = services.find(service => service.id === payload.service_id);

    if (!payload.appointment_date || !payload.start_time) {
      message.className = 'message error';
      message.textContent = 'Please choose an appointment date and an available time.';
      return;
    }

    if (payload.appointment_date < dateToday()) {
      message.className = 'message error';
      message.textContent = 'Please choose today or a future date.';
      return;
    }

    if (!chosen) {
      message.className = 'message error';
      message.textContent = 'Please select a valid service.';
      return;
    }

    const locationNote = [
      'CUSTOMER LOCATION',
      `State: ${payload.customer_state}`,
      `City: ${payload.customer_city}`,
      `Area: ${payload.customer_area}`,
      `Address: ${payload.customer_address}`,
      payload.maps_link ? `Maps: ${payload.maps_link}` : ''
    ].filter(Boolean).join('\n');

    const completeNote = [
      locationNote,
      payload.note ? `Additional note: ${payload.note}` : ''
    ].filter(Boolean).join('\n\n');

    message.className = 'message';
    message.textContent = 'Sending your booking request…';

    const button = form.querySelector('[type="submit"]');
    button.disabled = true;

    try {
      const { data, error } = await supabase.rpc('create_booking', {
        p_customer_name: payload.customer_name.trim(),
        p_phone: payload.phone.trim(),
        p_customer_email: payload.customer_email.trim(),
        p_service_id: payload.service_id,
        p_service_name: chosen.name,
        p_appointment_date: payload.appointment_date,
        p_start_time: payload.start_time,
        p_note: completeNote
      });

      if (error) throw error;

      if (!data) {
        throw new Error('Booking was saved but no booking reference was returned.');
      }

      form.reset();
      time.innerHTML = '<option value="">Select date first</option>';

      showPaymentChoices({ id: data });

    } catch (error) {
      message.className = 'message error';
      message.textContent = error.message?.includes('slot_taken')
        ? 'Sorry, that time was just booked. Please choose another time.'
        : `Booking failed: ${error.message || 'Please try again.'}`;

      date.dispatchEvent(new Event('change'));
    } finally {
      button.disabled = false;
    }
  });
}

function bindAdmin() {
  const modal = document.querySelector('#admin-modal');

  document.querySelector('#admin-open').onclick = () => {
    modal.classList.remove('hidden');
    renderAdmin();
  };

  document.querySelector('#admin-close').onclick = () => {
    modal.classList.add('hidden');
  };

  modal.addEventListener('click', event => {
    if (event.target === modal) modal.classList.add('hidden');
  });
}

async function isAdmin() {
  if (!currentSession) return false;

  const { data } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', currentSession.user.email)
    .maybeSingle();

  return !!data;
}

async function renderAdmin() {
  const content = document.querySelector('#admin-content');

  if (!configured) {
    content.innerHTML = `
      <p class="eyebrow">OWNER AREA</p>
      <h2>SETUP REQUIRED</h2>
      <p>Connect your Supabase project before owner sign-in can work.</p>
    `;
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  currentSession = session;

  if (!session) {
    content.innerHTML = `
      <p class="eyebrow">PRIVATE ACCESS</p>
      <h2>OWNER LOGIN.</h2>

      <form id="login-form">
        <label>Email
          <input name="email" type="email" required>
        </label>

        <label>Password
          <input name="password" type="password" required>
        </label>

        <button class="button full" type="submit">SIGN IN</button>
        <p id="login-error" class="message error"></p>
      </form>
    `;

    document.querySelector('#login-form').onsubmit = async event => {
      event.preventDefault();

      const formData = new FormData(event.target);

      const { error } = await supabase.auth.signInWithPassword({
        email: formData.get('email'),
        password: formData.get('password')
      });

      if (error) {
        document.querySelector('#login-error').textContent = error.message;
      } else {
        renderAdmin();
      }
    };

    return;
  }

  if (!await isAdmin()) {
    await supabase.auth.signOut();
    currentSession = null;

    content.innerHTML = `
      <p class="message error">This account is not authorized as the site owner.</p>
    `;
    return;
  }

  content.innerHTML = `
    <p class="eyebrow">PRIVATE OWNER AREA</p>
    <h2>YOUR DASHBOARD.</h2>

    <div class="admin-tabs">
      <button data-tab="bookings" class="active">Bookings</button>
      <button data-tab="payments">Payments</button>
      <button data-tab="announcements">News</button>
      <button data-tab="prices">Prices</button>
      <button data-tab="photos">Gallery</button>
    </div>

    <div id="admin-panel">Loading…</div>

    <button id="logout" class="text-link">SIGN OUT</button>
  `;

  document.querySelector('#logout').onclick = async () => {
    await supabase.auth.signOut();
    currentSession = null;
    renderAdmin();
  };

  document.querySelectorAll('[data-tab]').forEach(button => {
    button.onclick = () => {
      document.querySelectorAll('[data-tab]').forEach(item => {
        item.classList.remove('active');
      });

      button.classList.add('active');
      renderAdminTab(button.dataset.tab);
    };
  });

  renderAdminTab('bookings');
}

async function renderAdminTab(tab) {
  const panel = document.querySelector('#admin-panel');
  if (!panel) return;

  if (tab === 'bookings') {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      panel.textContent = error.message;
      return;
    }

    panel.innerHTML = data.length
      ? data.map(booking => `
          <article class="admin-booking">
            <div>
              <strong>${esc(booking.customer_name)}</strong>
              <p>${esc(booking.service_name)} · ${esc(booking.appointment_date)}</p>
              <p>${esc(String(booking.start_time).slice(0, 5))} · ${esc(booking.phone)}</p>
              <p>${esc(booking.customer_email || '')}</p>
              <p class="booking-note">${esc(booking.note || '')}</p>
              <small>${esc((booking.status || 'pending').toUpperCase())}</small>
            </div>

            <div class="admin-actions">
              <button data-status="confirmed" data-id="${esc(booking.id)}">Confirm</button>
              <button data-status="cancelled" data-id="${esc(booking.id)}">Cancel</button>
            </div>
          </article>
        `).join('')
      : '<p>No bookings yet.</p>';

    panel.querySelectorAll('[data-status]').forEach(button => {
      button.onclick = async () => {
        const newStatus = button.dataset.status;

        const { error } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', button.dataset.id);

        if (error) {
          alert(error.message);
          return;
        }

        renderAdminTab('bookings');
      };
    });

  } else if (tab === 'payments') {
    panel.innerHTML = '<p>Loading payments…</p>';

    const { data, error } = await supabase
      .from('booking_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      panel.textContent = error.message;
      return;
    }

    if (!data?.length) {
      panel.innerHTML = '<p>No payment receipts submitted yet.</p>';
      return;
    }

    panel.innerHTML = '';

    for (const payment of data) {
      const item = document.createElement('article');
      item.className = 'admin-booking';

      const signed = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(payment.receipt_path, 3600);

      const receiptLink = signed.data?.signedUrl
        ? `<a href="${esc(signed.data.signedUrl)}" target="_blank" rel="noopener noreferrer">VIEW RECEIPT ↗</a>`
        : '<span>Receipt link unavailable</span>';

      item.innerHTML = `
        <div>
          <strong>${money(Number(payment.amount))}</strong>
          <p>Booking ID: ${esc(payment.booking_id)}</p>
          <p>Status: ${esc(payment.status.toUpperCase())}</p>
          <p>${new Date(payment.created_at).toLocaleString('en-NG')}</p>
          ${receiptLink}
        </div>
        <div class="admin-actions">
          <button type="button" data-payment-status="verified">Verify</button>
          <button type="button" data-payment-status="rejected">Reject</button>
        </div>
      `;

      item.querySelectorAll('[data-payment-status]').forEach(button => {
        button.onclick = async () => {
          const newStatus = button.dataset.paymentStatus;

          const { error: updateError } = await supabase
            .from('booking_payments')
            .update({ status: newStatus })
            .eq('id', payment.id);

          if (updateError) {
            alert(updateError.message);
            return;
          }

          renderAdminTab('payments');
        };
      });

      panel.appendChild(item);
    }

  } else if (tab === 'announcements') {
    const { data, error } = await supabase
      .from('customer_announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      panel.textContent = error.message;
      return;
    }

    panel.innerHTML = `
      <form id="announcement-form">
        <h3>NEW CUSTOMER ANNOUNCEMENT</h3>

        <label>Announcement title
          <input name="title" maxlength="120" required
            placeholder="e.g. Special update">
        </label>

        <label>Message
          <textarea name="message" maxlength="1500" required
            placeholder="Write your announcement"></textarea>
        </label>

        <button class="button full" type="submit">PUBLISH ANNOUNCEMENT</button>
        <div id="announcement-message" aria-live="polite"></div>
      </form>

      <h3>PREVIOUS ANNOUNCEMENTS</h3>

      <div class="admin-announcement-list">
        ${data?.length ? data.map(item => `
          <article class="announcement-card">
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.message).replace(/\n/g, '<br>')}</p>
            <small>${esc(item.status.toUpperCase())} ·
              ${new Date(item.created_at).toLocaleDateString('en-NG')}
            </small>
          </article>
        `).join('') : '<p>No announcements published yet.</p>'}
      </div>
    `;

    document.querySelector('#announcement-form').onsubmit = async event => {
      event.preventDefault();

      const form = event.currentTarget;
      const formData = new FormData(form);
      const message = document.querySelector('#announcement-message');
      const button = form.querySelector('[type="submit"]');

      button.disabled = true;
      message.textContent = 'Publishing…';

      const { error: insertError } = await supabase
        .from('customer_announcements')
        .insert({
          title: String(formData.get('title')).trim(),
          message: String(formData.get('message')).trim(),
          status: 'sent',
          created_by: currentSession.user.id
        });

      button.disabled = false;

      if (insertError) {
        message.className = 'message error';
        message.textContent = insertError.message;
        return;
      }

      message.className = 'message success';
      message.textContent = 'Announcement published on the website.';
      form.reset();

      renderAdminTab('announcements');
      renderAnnouncements();
    };

  } else if (tab === 'prices') {
    panel.innerHTML = services.map(service => `
      <form class="price-edit" data-id="${esc(service.id)}">
        <label>${esc(service.name)}
          <input name="price" type="number" min="0" step="100"
            value="${service.price ?? ''}" placeholder="Leave blank for quote">
        </label>
        <button class="small-button">Save</button>
      </form>
    `).join('');

    panel.querySelectorAll('.price-edit').forEach(form => {
      form.onsubmit = async event => {
        event.preventDefault();

        const value = new FormData(form).get('price');
        const price = value === '' ? null : Number(value);
        const service = services.find(item => item.id === form.dataset.id);

        const { error } = await supabase.from('services').upsert({
          id: service.id,
          name: service.name,
          price
        });

        if (error) {
          alert(error.message);
        } else {
          await loadServices();
          renderAdminTab('prices');
        }
      };
    });

  } else if (tab === 'photos') {
    panel.innerHTML = `
      <form id="upload-form">
        <label>Photo caption
          <input name="caption" maxlength="100" placeholder="Fresh fade">
        </label>

        <label>Choose haircut photo
          <input name="photo" type="file"
            accept="image/jpeg,image/png,image/webp" required>
        </label>

        <button class="button">UPLOAD PHOTO</button>
      </form>

      <div id="upload-message"></div>

      <div class="admin-photo-list">
        ${gallery.map(photo => `
          <div>
            <img src="${esc(photo.url)}" alt="">
            <span>${esc(photo.caption || 'Photo')}</span>
            <button data-delete="${esc(photo.id)}"
              data-path="${esc(photo.storage_path)}">Delete</button>
          </div>
        `).join('')}
      </div>
    `;

    document.querySelector('#upload-form').onsubmit = async event => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const file = formData.get('photo');
      const message = document.querySelector('#upload-message');

      if (!file || file.size > 5 * 1024 * 1024) {
        message.textContent = 'Choose an image under 5 MB.';
        return;
      }

      const path =
        `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;

      const upload = await supabase.storage
        .from('gallery')
        .upload(path, file, { contentType: file.type });

      if (upload.error) {
        message.textContent = upload.error.message;
        return;
      }

      const insert = await supabase.from('gallery').insert({
        caption: formData.get('caption'),
        storage_path: path
      });

      if (insert.error) {
        message.textContent = insert.error.message;
        return;
      }

      await renderGallery();
      renderAdminTab('photos');
    };

    panel.querySelectorAll('[data-delete]').forEach(button => {
      button.onclick = async () => {
        if (!confirm('Delete this gallery photo?')) return;

        const removal = await supabase.storage
          .from('gallery')
          .remove([button.dataset.path]);

        if (removal.error) {
          alert(removal.error.message);
          return;
        }

        const deletion = await supabase
          .from('gallery')
          .delete()
          .eq('id', button.dataset.delete);

        if (deletion.error) {
          alert(deletion.error.message);
          return;
        }

        await renderGallery();
        renderAdminTab('photos');
      };
    });
  }
}

async function loadServices() {
  if (configured) {
    const { data, error } = await supabase
      .from('services')
      .select('id,name,price,description')
      .order('sort_order');

    if (!error && data?.length) {
      services = data;
    }
  }

  renderServices();
}

async function init() {
  shell();

  if (configured) {
    await loadServices();
    await renderGallery();
    await renderAnnouncements();

    supabase.auth.onAuthStateChange((_event, session) => {
      currentSession = session;
    });
  }
}

init();

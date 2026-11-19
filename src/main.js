import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const configured = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const defaults = [
  {id:'haircut',name:'Haircut',price:2000,description:'A clean, sharp cut.'},
  {id:'haircut-dye',name:'Haircut + Dye',price:3000,description:'A fresh cut with colour.'},
  {id:'shape-up',name:'Shape-up',price:1000,description:'A neat and precise finish.'},
  {id:'tint',name:'Tint',price:null,description:'Ask us for a quote.'},
  {id:'dreadlocks',name:'Dreadlocks',price:null,description:'Ask us for a quote.'},
  {id:'hair-relaxer',name:'Hair relaxer',price:null,description:'Ask us for a quote.'},
  {id:'beard-trim',name:'Beard trim',price:null,description:'Ask us for a quote.'},
  {id:'hair-wash',name:'Hair wash',price:null,description:'Ask us for a quote.'},
  {id:'haircut-beard',name:'Haircut + beard',price:null,description:'Ask us for a quote.'}
];
let services = defaults;
let gallery = [];
let currentSession = null;
const openingHours = {start:9,end:21};

const money = n => new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(n);
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateToday = () => {
  const d = new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  return d.toISOString().slice(0,10);
};
const slotOptions = () => {
  const out=[];
  for(let h=openingHours.start;h<openingHours.end;h++){
    for(const m of [0,30]) {
      const hh=String(h).padStart(2,'0'), mm=String(m).padStart(2,'0');
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
};
const timeLabel = t => {
  const [h,m]=t.split(':').map(Number);
  return `${((h+11)%12)+1}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`;
};
const app = document.querySelector('#app');

function shell() {
  app.innerHTML = `
    <header class="topbar"><a class="brand" href="#home">MIZZY<span>CUTZ.</span></a>
      <nav><a href="#services">Services</a><a href="#gallery">Gallery</a><a href="#book">Book now</a></nav>
      <a class="nav-cta" href="#book">Book a cut <span>↗</span></a>
    </header>
    <main>
      <section class="hero" id="home">
        <div class="hero-copy"><p class="eyebrow">OYSCATECH · OPEN DAILY 9AM–9PM</p>
          <h1>YOUR CUT.<br><em>YOUR</em> CONFIDENCE.</h1>
          <p class="intro">Clean cuts, sharp details and fresh confidence. Pull up to MIZZY CUTZ and leave looking your best.</p>
          <div class="hero-actions"><a class="button" href="#book">BOOK YOUR APPOINTMENT <span>↗</span></a><a class="text-link" href="#services">Explore services ↓</a></div>
          <div class="hero-meta"><span>01 — QUALITY SERVICE</span><span>02 — CLEAN FINISH</span><span>03 — GOOD ENERGY</span></div>
        </div>
        <div class="hero-art"><div class="art-circle"></div><div class="art-word">M<br>C</div><div class="art-caption">THE FRESH<br>LOOK STARTS HERE.</div><div class="art-stamp">MIZZY<br>CUTZ<br>✳</div></div>
      </section>
      <section class="ticker"><span>FRESH CUTS</span><b>✳</b><span>SHARP FINISH</span><b>✳</b><span>GOOD ENERGY</span><b>✳</b><span>MIZZY CUTZ</span></section>
      <section class="section" id="services"><div class="section-head"><div><p class="eyebrow">WHAT WE DO</p><h2>THE SERVICE<br><em>MENU.</em></h2></div><p class="section-note">The details matter. Choose your service and book a time that works for you.</p></div><div id="service-grid" class="service-grid"></div></section>
      <section class="gallery-section" id="gallery"><div class="section-head"><div><p class="eyebrow">THE WORK SPEAKS</p><h2>FRESH FROM<br><em>THE CHAIR.</em></h2></div><p class="section-note">A look at cuts and styles from MIZZY CUTZ.</p></div><div id="gallery-grid" class="gallery-grid"></div></section>
      <section class="booking-section" id="book"><div class="booking-intro"><p class="eyebrow">YOUR NEXT LOOK IS ONE BOOKING AWAY</p><h2>BOOK YOUR<br><em>FRESH CUT.</em></h2><p>Choose a service, date and available time. Your appointment is confirmed once the slot is successfully reserved.</p><div class="contact-card"><span>CALL / WHATSAPP</span><strong>09029061551</strong><span>LOCATION</span><strong>OYSCATECH</strong><span>PAYMENT</span><strong>Pay at the shop · No deposit</strong></div></div>
        <form id="booking-form" class="booking-form"><h3>MAKE AN APPOINTMENT</h3><label>Your name<input name="customer_name" required maxlength="80" placeholder="Full name"></label><label>Phone number<input name="phone" required maxlength="20" placeholder="Your phone number"></label><label>Choose a service<select name="service_id" id="booking-service" required></select></label><div class="form-row"><label>Date<input type="date" name="appointment_date" min="${dateToday()}" required></label><label>Time<select name="start_time" id="booking-time" required><option value="">Select date first</option></select></label></div><label>Note (optional)<textarea name="note" maxlength="300" placeholder="Anything we should know?"></textarea></label><button class="button full" type="submit">CONFIRM BOOKING <span>↗</span></button><p class="form-hint">No deposit required. Pay at the shop.</p><div id="booking-message" aria-live="polite"></div></form>
      </section>
      <section class="final-cta"><p class="eyebrow">MIZZY CUTZ · OYSCATECH</p><h2>STAY FRESH.<br><em>STAY SHARP.</em></h2><a class="button" href="#book">BOOK YOUR CUT ↗</a></section>
    </main>
    <footer><a class="brand" href="#home">MIZZY<span>CUTZ.</span></a><span>© ${new Date().getFullYear()} MIZZY CUTZ. ALL RIGHTS RESERVED.</span><button id="admin-open" class="admin-link">OWNER LOGIN</button></footer>
    <div id="admin-modal" class="modal hidden"><div class="modal-card"><button class="close" id="admin-close" aria-label="Close">×</button><div id="admin-content"></div></div></div>`;
  renderServices(); renderGallery(); bindBooking(); bindAdmin();
}
function renderServices(){
  document.querySelector('#service-grid').innerHTML=services.map((s,i)=>`<article class="service-card"><span class="service-no">0${i+1}</span><div><h3>${esc(s.name)}</h3><p>${esc(s.description||'Made fresh at MIZZY CUTZ.')}</p></div><strong>${s.price==null?'Price on request':money(s.price)}</strong></article>`).join('');
  document.querySelector('#booking-service').innerHTML='<option value="">Select a service</option>'+services.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} — ${s.price==null?'Price on request':money(s.price)}</option>`).join('');
}
async function renderGallery(){
  if(configured){
    const {data}=await supabase.from('gallery').select('id,caption,storage_path,created_at').order('created_at',{ascending:false});
    if(data) gallery=data.map(x=>({...x,url:supabase.storage.from('gallery').getPublicUrl(x.storage_path).data.publicUrl}));
  }
  const el=document.querySelector('#gallery-grid');
  el.innerHTML=gallery.length?gallery.map(g=>`<figure class="gallery-item"><img src="${esc(g.url)}" alt="${esc(g.caption||'MIZZY CUTZ haircut')}" loading="lazy"><figcaption>${esc(g.caption||'MIZZY CUTZ')}</figcaption></figure>`).join(''):'<div class="gallery-empty"><span>✳</span><h3>YOUR NEXT CUT COULD BE HERE.</h3><p>Our haircut gallery will appear here. The owner can add photos from the dashboard.</p></div>';
}
async function bindBooking(){
  const form=document.querySelector('#booking-form'), date=form.elements.appointment_date, time=document.querySelector('#booking-time');
  date.addEventListener('change',async()=>{
    time.innerHTML='<option value="">Loading available times…</option>';
    if(!configured){time.innerHTML='<option value="">Website setup required</option>';return;}
    const {data,error}=await supabase.rpc('get_booked_slots',{p_appointment_date:date.value});
    if(error){time.innerHTML='<option value="">Could not load times</option>';return;}
    const taken=new Set((data||[]).map(x=>String(x.start_time).slice(0,5)));
    const available=slotOptions().filter(t=>!taken.has(t));
    time.innerHTML='<option value="">Choose a time</option>'+available.map(t=>`<option value="${t}">${timeLabel(t)}</option>`).join('');
    if(!available.length) time.innerHTML='<option value="">No slots available — choose another date</option>';
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault(); const msg=document.querySelector('#booking-message');
    if(!configured){msg.className='message error';msg.textContent='Online booking is not connected yet. The owner must finish the website setup.';return;}
    const fd=new FormData(form), payload=Object.fromEntries(fd.entries());
    const chosen=services.find(s=>s.id===payload.service_id);
    if(!chosen){msg.className='message error';msg.textContent='Please select a valid service.';return;}
    msg.className='message';msg.textContent='Reserving your time…';
    const {data,error}=await supabase.rpc('create_booking',{
      p_customer_name:payload.customer_name.trim(),p_phone:payload.phone.trim(),
      p_service_id:payload.service_id,p_service_name:chosen.name,
      p_appointment_date:payload.appointment_date,p_start_time:payload.start_time,
      p_note:(payload.note||'').trim()
    });
    if(error){msg.className='message error';msg.textContent=error.message.includes('slot_taken')?'Sorry, that time was just booked. Please choose another time.':`Booking failed: ${error.message}`;date.dispatchEvent(new Event('change'));return;}
    msg.className='message success';msg.innerHTML=`Your appointment is confirmed, ${esc(payload.customer_name)}!<br>${esc(chosen.name)} · ${esc(payload.appointment_date)} · ${timeLabel(payload.start_time)}<br>We look forward to seeing you at MIZZY CUTZ.`;
    form.reset();time.innerHTML='<option value="">Select date first</option>';
  });
}
function bindAdmin(){
  const modal=document.querySelector('#admin-modal');
  document.querySelector('#admin-open').onclick=()=>{modal.classList.remove('hidden');renderAdmin();};
  document.querySelector('#admin-close').onclick=()=>modal.classList.add('hidden');
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden');});
}
async function isAdmin(){
  if(!currentSession)return false;
  const {data}=await supabase.from('admin_users').select('email').eq('email',currentSession.user.email).maybeSingle();
  return !!data;
}
async function renderAdmin(){
  const c=document.querySelector('#admin-content');
  if(!configured){c.innerHTML='<p class="eyebrow">OWNER AREA</p><h2>SETUP REQUIRED</h2><p>Connect the Supabase project using the setup guide before owner sign-in can work.</p>';return;}
  const {data:{session}}=await supabase.auth.getSession();currentSession=session;
  if(!session){
    c.innerHTML='<p class="eyebrow">PRIVATE ACCESS</p><h2>OWNER LOGIN.</h2><form id="login-form"><label>Email<input name="email" type="email" required></label><label>Password<input name="password" type="password" required></label><button class="button full">SIGN IN</button><p id="login-error" class="message error"></p></form>'; 
    document.querySelector('#login-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);const {error}=await supabase.auth.signInWithPassword({email:fd.get('email'),password:fd.get('password')});if(error)document.querySelector('#login-error').textContent=error.message;else renderAdmin();};
    return;
  }
  if(!await isAdmin()){await supabase.auth.signOut();currentSession=null;c.innerHTML='<p class="message error">This account is not authorized as the site owner.</p>';return;}
  c.innerHTML=`<p class="eyebrow">PRIVATE OWNER AREA</p><h2>YOUR DASHBOARD.</h2><div class="admin-tabs"><button data-tab="bookings" class="active">Bookings</button><button data-tab="prices">Prices</button><button data-tab="photos">Gallery</button></div><div id="admin-panel">Loading…</div><button id="logout" class="text-link">Sign out</button>`;
  document.querySelector('#logout').onclick=async()=>{await supabase.auth.signOut();currentSession=null;renderAdmin();};
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderAdminTab(b.dataset.tab);});
  renderAdminTab('bookings');
}
async function renderAdminTab(tab){
  const panel=document.querySelector('#admin-panel');if(!panel)return;
  if(tab==='bookings'){
    const {data,error}=await supabase.from('bookings').select('*').order('appointment_date',{ascending:true}).order('start_time',{ascending:true});
    if(error){panel.textContent=error.message;return;}
    panel.innerHTML=data.length?data.map(b=>`<article class="admin-booking"><div><strong>${esc(b.customer_name)}</strong><p>${esc(b.service_name)} · ${esc(b.appointment_date)} · ${timeLabel(b.start_time.slice(0,5))}</p><p>${esc(b.phone)} ${b.note?'· '+esc(b.note):''}</p><small>${esc(b.status.toUpperCase())}</small></div><div class="admin-actions"><button data-status="confirmed" data-id="${b.id}">Confirm</button><button data-status="cancelled" data-id="${b.id}">Cancel</button></div></article>`).join(''):'<p>No bookings yet.</p>';
    panel.querySelectorAll('[data-status]').forEach(btn=>btn.onclick=async()=>{await supabase.from('bookings').update({status:btn.dataset.status}).eq('id',btn.dataset.id);renderAdminTab('bookings');});
  } else if(tab==='prices'){
    panel.innerHTML=services.map(s=>`<form class="price-edit" data-id="${esc(s.id)}"><label>${esc(s.name)}<input name="price" type="number" min="0" step="100" value="${s.price??''}" placeholder="Leave blank for quote"></label><button class="small-button">Save</button></form>`).join('');
    panel.querySelectorAll('.price-edit').forEach(f=>f.onsubmit=async e=>{e.preventDefault();const v=new FormData(f).get('price');const price=v===''?null:Number(v);const {error}=await supabase.from('services').upsert({id:f.dataset.id,name:services.find(s=>s.id===f.dataset.id).name,price});if(error)alert(error.message);else await loadServices();});
  } else {
    panel.innerHTML=`<form id="upload-form"><label>Photo caption<input name="caption" maxlength="100" placeholder="Fresh fade"></label><label>Choose haircut photo<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label><button class="button">UPLOAD PHOTO</button></form><div id="upload-message"></div><div class="admin-photo-list">${gallery.map(g=>`<div><img src="${esc(g.url)}" alt=""><span>${esc(g.caption||'Photo')}</span><button data-delete="${g.id}" data-path="${esc(g.storage_path)}">Delete</button></div>`).join('')}</div>`;
    document.querySelector('#upload-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target),file=fd.get('photo');if(!file||file.size>5*1024*1024){document.querySelector('#upload-message').textContent='Choose an image under 5 MB.';return;}const path=`${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g,'-')}`;const up=await supabase.storage.from('gallery').upload(path,file,{contentType:file.type});if(up.error){document.querySelector('#upload-message').textContent=up.error.message;return;}const ins=await supabase.from('gallery').insert({caption:fd.get('caption'),storage_path:path});if(ins.error){document.querySelector('#upload-message').textContent=ins.error.message;return;}await renderGallery();renderAdminTab('photos');};
    panel.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this gallery photo?'))return;await supabase.storage.from('gallery').remove([b.dataset.path]);await supabase.from('gallery').delete().eq('id',b.dataset.delete);await renderGallery();renderAdminTab('photos');});
  }
}
async function loadServices(){
  if(configured){const {data}=await supabase.from('services').select('id,name,price,description').order('sort_order');if(data?.length)services=data;}
  renderServices();
}
async function init(){
  shell();
  if(configured){await loadServices();await renderGallery();supabase.auth.onAuthStateChange((_event,session)=>{currentSession=session;});}
}
init();

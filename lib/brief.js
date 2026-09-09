'use strict';

/* =========================================================
   THE BRIEF

   Everything a page needs to say, from the five questions answered on
   zahbrandsolutions.com/start. Arrives as SITE_BRIEF (JSON) on the Railway
   service; anything missing gets a sensible default so the site always
   renders, and the client's own AI fills in the rest.

     business   "Northside Plumbing"           required
     tagline    one sentence about what you do required
     city/state "Rock Hill", "SC"
     industry   "plumbing"                     used in copy, lowercase
     services   ["Water heaters", ...]         3 to 6 lines; "Name: detail" splits
     phone      "(803) 555-0100"
     email      "hello@example.com"
     hours      "Mon to Fri, 8 to 6"
     accent     "#c1121f"                      optional; each design has its own

   The derived fields (initials, place, serviceRows, year) are computed here
   so the templates stay dumb.
   ========================================================= */

const DEFAULT_SERVICES = [
  'What you do best: the service most people call you for',
  'Your second service: what it is and who it is for',
  'Your third service: one line is plenty',
];

function clean(s, max = 200) { return String(s == null ? '' : s).trim().slice(0, max); }

function parseBrief(raw) {
  let b = {};
  if (raw && typeof raw === 'object') b = raw;
  else if (raw) { try { b = JSON.parse(raw); } catch (e) { b = {}; } }

  const business = clean(b.business, 80) || process.env.SITE_NAME || 'Your Business';
  const tagline = clean(b.tagline, 240) || `${business} does the work properly, on time, and tells you what it costs before it starts.`;
  const city = clean(b.city, 60);
  const state = clean(b.state, 30);
  const industry = clean(b.industry, 60).toLowerCase();
  const phone = clean(b.phone, 40) || process.env.CONTACT_PHONE || '';
  const email = clean(b.email, 120) || process.env.CONTACT_EMAIL || '';
  const hours = clean(b.hours, 80);
  const accent = /^#[0-9a-fA-F]{6}$/.test(clean(b.accent, 7)) ? clean(b.accent, 7) : '';

  let services = Array.isArray(b.services) ? b.services : String(b.services || '').split(/\r?\n/);
  services = services.map((s) => clean(typeof s === 'object' ? `${s.name}: ${s.line || ''}` : s, 200)).filter(Boolean).slice(0, 6);
  if (!services.length) services = DEFAULT_SERVICES;
  const serviceRows = services.map((s) => {
    const i = s.indexOf(':');
    const name = i > 0 ? s.slice(0, i).trim() : s;
    const line = i > 0 ? s.slice(i + 1).trim() : '';
    return { name, line };
  });

  const words = business.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || 'Z').slice(0, 2)).toUpperCase();
  const place = [city, state].filter(Boolean).join(', ');

  return {
    business, tagline, city, state, place, industry, phone, email, hours, accent,
    services, serviceRows, initials,
    industryLabel: industry || 'local business',
    telHref: phone ? 'tel:' + phone.replace(/[^\d+]/g, '') : '',
    year: String(new Date().getFullYear()),
  };
}

module.exports = { parseBrief };

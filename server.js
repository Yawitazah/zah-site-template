/* =========================================================
   ZAH SITE TEMPLATE, the self-serve client site

   Every site that starts at zahbrandsolutions.com/start runs this exact
   repo. Nothing here is written for one client: the words come from the
   brief (SITE_BRIEF), the identity from the environment, and everything
   else is a ZAH product INSTALLED from its own repo and mounted in the
   standard order. See HANDOFF.md, and the zah-client-site skill.

     1. ZAH Gate        care-plan holding page, fails open
     2. ZAH CRM seam    /api/lead door + owner alerts, CRM off until added
     3. Zah Editor      the pencil editor engine
     4. ZAH Site MCP    serves the pages; the client's AI builds on them
     5. ZAH Pay         package checkout into the client's own Stripe, off
     6. this file       /designs, /healthz, /robots.txt, static, 404

   TWO DESIGNS, ONE SITE, like New Vision: both designs are rendered from
   the same brief and both are live. `/` shows the primary; the other keeps
   its own address until the client hides it. Two Site MCP settings do it
   ("make ledger my front page", "hide the other design"), so the client
   never needs a developer to choose.

   Nothing is client-specific in this file. To improve a client's site,
   use Site MCP or the editor on THAT site. To improve every site, change
   this repo: every service redeploys from it, and pages a client has not
   restructured pick the change up.
   ========================================================= */
require('dotenv').config();

const fs = require('fs');
const express = require('express');
const path = require('path');
const zahGate = require('zah-gate-client');
const zahCrm = require('zah-crm-seam');
const zahEditor = require('zah-editor');
const zahSite = require('zah-site-mcp');
const zahPay = require('zah-pay');
const { render } = require('./lib/render');
const { parseBrief } = require('./lib/brief');

const PORT = process.env.PORT || 8080;
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const SITE_ID = process.env.SITE_ID || 'zah-site';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const BUILT_DIR = path.join(__dirname, '.built');

const brief = parseBrief(process.env.SITE_BRIEF);
const SITE_NAME = process.env.SITE_NAME || brief.business;

/* The designs. Both are always rendered; TEMPLATE picks which one is the
   front page on the first boot, and the client can change it later. */
const DESIGNS = {
  studio: { path: '/studio', file: path.join(BUILT_DIR, 'studio.html'), label: 'Studio: dark, bold, one accent', accent: '#e8542a' },
  ledger: { path: '/ledger', file: path.join(BUILT_DIR, 'ledger.html'), label: 'Ledger: light, editorial, numbered', accent: '#0f4c81' },
};
const DEFAULT_DESIGN = DESIGNS[process.env.TEMPLATE] ? process.env.TEMPLATE : 'studio';

/* Render both designs from the brief at boot. Deterministic from the
   environment, so the ephemeral .built/ directory is fine: a redeploy
   rebuilds the same files. The client's edits live in Site MCP's overlay
   on the volume and are never in these files. */
fs.mkdirSync(BUILT_DIR, { recursive: true });
for (const [key, d] of Object.entries(DESIGNS)) {
  const tpl = fs.readFileSync(path.join(__dirname, 'templates', `${key}.html`), 'utf8');
  const data = Object.assign({}, brief, {
    siteName: SITE_NAME,
    accent: brief.accent || d.accent,
    publicUrl: PUBLIC_URL,
    designKey: key,
    editorHash: process.env.EDITOR_ADMIN_HASH || '',
    storageKey: `${SITE_ID}-${key}-v1`,
    leadPath: '/api/lead',
  });
  fs.writeFileSync(d.file, render(tpl, data));
}
for (const f of ['404.html', 'thanks.html']) {
  const tpl = fs.readFileSync(path.join(__dirname, 'templates', f), 'utf8');
  fs.writeFileSync(path.join(BUILT_DIR, f), render(tpl, Object.assign({}, brief, { siteName: SITE_NAME })));
}
const notFound = (res) => res.status(404).sendFile(path.join(BUILT_DIR, '404.html'));

const app = express();
app.disable('x-powered-by');
// Railway puts several proxies in front of the app. `true` is what makes
// req.ip and req.protocol honest here; `1` resolves to a Railway address.
app.set('trust proxy', true);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

/* 1. ZAH Gate. Off unless GATE_URL and SITE_ID are set; fails open. */
const gate = zahGate.mount(app, {
  name: SITE_NAME,
  mark: '/assets/mark.svg',
  email: brief.email,
  ink: '#14161a',
  accent: brief.accent || DESIGNS[DEFAULT_DESIGN].accent,
});

/* 2. ZAH CRM seam: the /api/lead door. CRM off until the client adds it
   from their account; owner alerts (NOTIFY_EMAIL_TO + a mail provider) are
   set by ZAH Onboarding at provisioning, so enquiries reach the owner's
   inbox from the first day, CRM or not. */
const crm = zahCrm.mount(app, {
  business: SITE_NAME,
  group: SITE_NAME,
  leadPath: '/api/lead',
});

/* 3. Zah Editor engine, served from the package. */
zahEditor.mount(app);

/* Which design is on the front page, and is the other one reachable. Read
   at request time, so a settings change takes effect on the next visit. */
const primaryKey = () => (DESIGNS[String(site.settings().primaryDesign || '').trim().toLowerCase()] ? String(site.settings().primaryDesign).trim().toLowerCase() : DEFAULT_DESIGN);
const alternateKey = () => Object.keys(DESIGNS).find((k) => k !== primaryKey());
const alternateShown = () => String(site.settings().showAlternate || 'yes').trim().toLowerCase() !== 'no';

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const p = req.path;
  // The front page is a rewrite, not a redirect: visitors stay on `/`.
  if (p === '/') { req.url = DESIGNS[primaryKey()].path + req.url.slice(1); return next(); }
  if (p === DESIGNS[alternateKey()].path && !alternateShown()) return notFound(res);
  // The raw files would bypass Site MCP and serve the build without edits.
  if (/^\/(studio|ledger|index|404|thanks)\.html$/.test(p)) return notFound(res);
  next();
});

/* 4. ZAH Site MCP: the client's AI builds on the site; Save publishes. */
const site = zahSite.mount(app, {
  siteId: SITE_ID,
  name: SITE_NAME,
  dataDir: DATA_DIR,
  token: process.env.SITE_MCP_TOKEN,
  adminHash: process.env.EDITOR_ADMIN_HASH,
  publicUrl: PUBLIC_URL || undefined,
  pages: [
    // The first page is the template for client-created pages, so the
    // chosen design goes first.
    ...[DEFAULT_DESIGN, ...Object.keys(DESIGNS).filter((k) => k !== DEFAULT_DESIGN)].map((k) => ({ path: DESIGNS[k].path, file: DESIGNS[k].file, root: 'main' })),
  ],
  crm: { leadPath: crm.leadPath, enabled: crm.leadsEnabled },
  settings: {
    phone: { label: 'Contact phone (header, footer, contact section)', kind: 'phone', default: brief.phone },
    email: { label: 'Contact email', kind: 'text', default: brief.email },
    bookingUrl: { label: 'Where "Book" and "Get a quote" buttons go (empty = the contact form)', kind: 'url', default: '' },
    primaryDesign: { label: `Which design the front page shows: ${Object.keys(DESIGNS).join(' or ')}`, kind: 'text', default: DEFAULT_DESIGN },
    showAlternate: { label: 'Keep the other design reachable at its own address: yes or no', kind: 'text', default: 'yes' },
  },
});

/* 5. ZAH Pay: OFF until the client pastes her own Stripe keys on her
   account page. Packages are a Site MCP-editable file later; for now the
   list is empty, so the product mounts, reports off, and sells nothing. */
let PACKAGES = [];
try { PACKAGES = require('./packages'); } catch (e) { PACKAGES = []; }
const pay = zahPay.mount(app, {
  packages: PACKAGES,
  stripeKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  enabled: process.env.PAYMENTS_ENABLED === 'true',
  publicUrl: PUBLIC_URL || undefined,
  booking: () => ({ url: site.settings().bookingUrl || '/#contact', phone: site.settings().phone }),
  successPath: '/thanks',
  cancelPath: '/#services',
  onPaid: async (info) => {
    if (!crm.leadsEnabled()) return;
    await crm.createLead({ name: info.name || 'Package purchase', email: info.email, phone: info.phone, service: info.package ? info.package.name : undefined, status: 'customer', message: `Bought ${info.package ? info.package.name : 'a package'} (${info.plan}) for $${info.amountUsd} via Stripe Checkout ${info.sessionId}` });
  },
});

/* 6. The site. */
app.use(express.json({ limit: '32kb' }));

// What ZAH Onboarding's desk reads for the Design tab. Generic: any site on
// this frame can answer the same question.
app.get('/designs', (_req, res) => res.json({
  primary: primaryKey(),
  alternateShown: alternateShown(),
  options: Object.entries(DESIGNS).map(([key, d]) => ({ key, path: d.path, label: d.label })),
}));

app.get('/healthz', (_req, res) => res.json({
  ok: true,
  site: SITE_ID,
  template: 'zah-site-template',
  payments: pay.enabled(),
  crmLeads: crm.leadsEnabled(),
  crmInvoices: crm.invoicesEnabled(),
  notify: crm.notify(),
  gate: gate.state(),
  design: primaryKey(),
}));

app.get('/thanks', (_req, res) => res.sendFile(path.join(BUILT_DIR, 'thanks.html')));

/* The owner's back office. Their own domain is where they go looking for it,
   so /account and /login land on the ZAH Account hub: their site, plan,
   billing, and the one login that carries through to ZAH CRM.
   302 and never 301 — the target is a variable so it can move to a per-site
   subdomain later without a permanently cached redirect fighting the change. */
const ACCOUNT_URL = (process.env.ACCOUNT_URL || 'https://zahbrandsolutions.com/account').replace(/\/+$/, '');
app.get(['/account', '/login'], (_req, res) => res.redirect(302, ACCOUNT_URL));

const ROBOTS = ['User-agent: *', 'Allow: /', 'Disallow: /thanks', 'Disallow: /account', 'Disallow: /login', ...Object.values(DESIGNS).map((d) => `Disallow: ${d.path}`), ''].join('\n');
app.get('/robots.txt', (_req, res) => res.type('text/plain').send(ROBOTS));

// The site's mark: the initials in a sharp square with the accent notch.
// Generated so every site has a favicon and a holding-page logo from day
// one; the client's AI replaces it with a real logo (add_asset + set_image).
app.get('/assets/mark.svg', (_req, res) => {
  const accent = brief.accent || DESIGNS[primaryKey()].accent;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect x="1" y="1" width="62" height="62" fill="#14161a" stroke="#f4f2ee" stroke-opacity=".35"/><rect x="50" y="50" width="13" height="13" fill="${accent}"/><text x="30" y="40" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-size="24" font-weight="500" fill="#f4f2ee" letter-spacing="1">${brief.initials}</text></svg>`;
  res.type('image/svg+xml').setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  setHeaders(res, file) {
    // Nothing is content hashed. CSS and JS revalidate on every visit; the
    // marks and images are cached hard.
    res.setHeader('Cache-Control', /\.(svg|png|jpg|jpeg|webp|woff2?)$/i.test(file) ? 'public, max-age=604800' : 'no-cache');
  },
}));

app.use((_req, res) => notFound(res));

app.listen(PORT, () => {
  console.log(`\n  ${SITE_NAME} (${SITE_ID}) on the ZAH site template`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  designs:  / -> ${DESIGNS[primaryKey()].path}, other ${alternateShown() ? 'at ' + DESIGNS[alternateKey()].path : 'hidden'}`);
  console.log(`  zah pay:  ${pay.enabled() ? 'ON' : 'off (waiting on the client\'s Stripe keys)'}`);
  console.log(`  zah crm:  leads ${crm.leadsEnabled() ? 'ON' : 'off'}; owner alerts email ${crm.notify().email.on ? 'ON' : 'off'}`);
  console.log(`  site mcp: ${process.env.SITE_MCP_TOKEN ? 'ON' : 'off (no SITE_MCP_TOKEN)'}\n`);
});

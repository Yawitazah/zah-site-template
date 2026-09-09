# ZAH Site Template

The ZAH client-site frame as a deployable starter. Every self-serve site that
begins at **zahbrandsolutions.com/start** is one Railway service running this
exact repo: the words come from the client's five-question brief, the identity
from environment variables, and every feature is a ZAH product installed from
its own repo and mounted in the standard order.

**Do not copy this into a client repo. Do not write client-specific code in it.**
A client's site is improved on that site (Zah Editor, ZAH Site MCP). Every site
is improved here: push to `main` and every service redeploys from it.

## What a site runs

| # | Product | Package | State on day one |
|---|---|---|---|
| 1 | ZAH Gate | `zah-gate-client` | on when `GATE_URL` + `SITE_ID` are set; fails open |
| 2 | ZAH CRM seam | `zah-crm-seam` | `/api/lead` door on; CRM off; owner email alerts on |
| 3 | Zah Editor | `zah-editor` | on; login is the client's email + generated password |
| 4 | ZAH Site MCP | `zah-site-mcp` | on with `SITE_MCP_TOKEN`; both designs are pages |
| 5 | ZAH Pay | `zah-pay` 0.3+ | mounted, off, zero packages |
| 6 | this repo | | `/designs`, `/healthz`, `/robots.txt`, `/assets`, 404 |

Two designs, one site (the New Vision pattern): `studio` (dark) and `ledger`
(light) are both rendered from the brief at boot and both are live. `/` shows
the primary; the other keeps its own address until the client hides it, through
two Site MCP settings (`primaryDesign`, `showAlternate`).

## Environment

| Variable | Set by | What |
|---|---|---|
| `SITE_ID` | provisioning | matches the Stripe subscription's `site_id` (ZAH Gate) |
| `SITE_NAME` | provisioning | the business name |
| `SITE_BRIEF` | provisioning | JSON: `business, tagline, city, state, industry, services[], phone, email, hours, accent` |
| `TEMPLATE` | provisioning | `studio` or `ledger`: the front page on first boot |
| `SITE_MCP_TOKEN` | provisioning | the client's AI presents this; ZBS keeps a copy in `zah_sites.mcp_token` |
| `EDITOR_ADMIN_HASH` | provisioning | `sha256(email:password)` for Zah Editor / Publish |
| `DATA_DIR` | provisioning | `/data`, a Railway volume; the client's edits and uploads |
| `PUBLIC_URL` | provisioning | the service's public address |
| `GATE_URL` | provisioning | the ZAH Gate service |
| `NOTIFY_EMAIL_TO`, `ZEPTOMAIL_TOKEN`, `ZEPTOMAIL_FROM` | provisioning | enquiry alerts to the owner from day one |
| `ZAH_CRM_API_KEY`, `CRM_LEADS_ENABLED`, `CRM_GROUP`, `CRM_BUSINESS` | the CRM upgrade on the desk | forms become CRM leads |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENTS_ENABLED` | the client, from the desk | ZAH Pay on |

With nothing set the site still boots and serves a sensible placeholder.

## Run it locally

```bash
npm install
SITE_BRIEF='{"business":"Northside Plumbing","city":"Rock Hill","state":"SC","services":["Water heaters: repair","Drains"]}' PORT=4370 node server.js
```

`npm test` covers the renderer and the brief parser.

## Adding a third design

Add `templates/<key>.html` + `assets/<key>.css` and one line in `DESIGNS` in
`server.js`. Every site gets it on the next deploy. Keep the house rule: sharp
geometry, hairline rules, Archivo + JetBrains Mono, one accent, numbered
sections, no reduced-motion branch, the `data-zs-credit` footer link intact.

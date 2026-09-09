# ZAH Site Template, handoff

Built 2026-09-09 as the first half of **Phase A, the front door**: a stranger
at zahbrandsolutions.com/start answers five questions, picks a design, pays the
care plan, and ZAH Onboarding creates a Railway service from this repo. See the
ZBS repo (`D:\zah-brand-solutions`), `lib/provision.ts` and `lib/sites.ts`, for
the other half.

## Where things run

| | |
|---|---|
| Repo | https://github.com/Yawitazah/zah-site-template (public; nothing secret in it) |
| Railway project | `zah-client-sites` `cc90daab-5c63-4067-a424-79b2faf4587e`, environment `production` `1b7c738b-bbdd-4812-9a7d-7f524692b213` |
| One service per client | created by ZBS `lib/provision.ts` from this repo; volume at `/data` |
| Demo service | `template-demo`: the two designs the /start page previews |

## Rules this repo keeps

- **Nothing client-specific.** No client name, no client colour, no client
  page. The brief is data; the designs are the same for everyone.
- **Products are installed, never copied.** `package.json` pins each to its
  GitHub repo; `npm update <name>` here, then push, and every site follows.
- **Both designs always render.** A design that fails to render is a boot
  failure for every site, so `npm test` and a local boot come before a push.
- **Pages a client has restructured keep their snapshot.** A push here
  changes untouched pages only. Say so when a client asks why a change did
  not reach them: `reset_page` in Site MCP brings the new build back.

## Traps already met

- `zah-pay` before 0.3.0 refused an empty package list; 0.3.0 allows it. That
  is why every self-serve site can mount Pay in the off state.
- The renderer handles loops before ifs so an `{{#if .line}}` inside
  `{{#serviceRows}}` sees the row. Ifs do not nest inside each other.
- Railway's `PORT` is injected; the Dockerfile exposes 8080 for local runs.

# HubSpot Marketplace submission checklist — Hi Energy AI

Use this checklist before submitting the listing in your HubSpot developer account.

## Code & project

- [x] Developer platform `2025.2` (`hsproject.json`)
- [x] UI extension app cards (not legacy CRM cards)
- [x] OAuth auth with `distribution: "marketplace"`
- [x] Minimum scopes only: `crm.objects.companies.read`, `crm.objects.contacts.read`
- [x] App settings page for API key connection
- [x] Server-side Hi Energy MCP calls (API key never in browser)
- [x] `permittedUrls.fetch` includes Hi Energy domains
- [x] Production OAuth redirect URL configured
- [x] Support block in `app-hsmeta.json`
- [x] App logo at `src/app/app-logo.png` (512×512, from Hi Energy Chrome extension)
- [x] `npm run validate` passes locally (27 tests)
- [x] GitHub Actions CI + deploy workflows (`.github/workflows/`)
- [ ] `hs project upload` succeeds in GitHub Actions after secrets are configured

## Hi Energy backend (required before public launch)

- [ ] Deploy `POST https://app.hienergy.ai/hubspot/settings` to store portal → API key mappings
- [ ] Deploy Breeze webhook routes under `/hubspot/breeze/tools/*` (optional; workflow actions are unpublished until live)
- [ ] Publish setup guide at a public HTTPS URL for the listing form

## HubSpot pre-submission requirements

- [ ] At least **3 active unique installs** in unaffiliated production accounts (last 30 days)
- [ ] OAuth activity logged (install + card usage)
- [ ] Technology Partner Program Agreement accepted
- [ ] Listing copy matches actual app behavior (`marketplace/listing.md`)
- [ ] Shared data table matches OAuth scopes exactly
- [ ] Live support, privacy, and terms URLs verified
- [ ] Setup documentation URL points to public guide (`marketplace/setup-guide.md` hosted publicly)
- [ ] Install button URL points to Marketplace listing or install flow
- [ ] Pricing in listing matches hienergy.ai (integration requires paid Hi Energy API access)
- [ ] Three **1280×800** screenshots uploaded:
  1. Company record — Research company / Hi Energy AI results
  2. Contact record — universal search results
  3. Connected Apps → Hi Energy AI → Settings (API key)

## OAuth (May 2026 requirements)

- [ ] App uses OAuth **v3 / 2026-03** token endpoints for new listings
- [ ] Token refresh handled by HubSpot install flow (no copy/paste tokens)

## App cards to verify manually

- [ ] Company **Hi Energy company research** tab card added via Card library
- [ ] Company **Research company** sidebar card added via Card library
- [ ] Contact **Hi Energy contact search** tab card added via Card library
- [ ] Error states mention Connected Apps settings when API key missing
- [ ] External links open in new tab (`external: true`)

## Certification (optional, after listing)

- [ ] Security questionnaire completed
- [ ] Demo video recorded (install, settings, research, uninstall)
- [ ] Uninstall calls HubSpot app uninstall API
- [ ] 95%+ API success rate maintained
- [ ] Set Breeze workflow actions `isPublished: true` only after webhooks are live

## Submit

1. HubSpot developer account → your app → **Marketplace listing**
2. Paste content from `marketplace/listing.md`
3. Attach screenshots and setup guide URL
4. Submit for Ecosystem Quality review

Expected initial review: ~10 business days.

# Hi Energy AI — HubSpot Marketplace App

HubSpot CRM integration for [Hi Energy AI](https://app.hienergy.ai). Shows advertisers, deals, and contacts from Hi Energy on **company** and **contact** record tabs — built for the [HubSpot Marketplace](https://ecosystem.hubspot.com/marketplace/).

Companion to the [Hi Energy Google Workspace add-on](https://github.com/HiEnergyAgency/hienergy-workspace-addon).

## Features

- **Company card** — Research button + full Hi Energy results on company record tabs
- **Research company sidebar** — One-click research action in the company record sidebar
- **Contact card** — Uses email domain or company name for universal search
- **Settings page** — Customers connect their Hi Energy API key in Connected Apps
- **Breeze agent tools** — Optional Hi Energy tools for Breeze Studio agents (unpublished until webhooks are live)
- **Marketplace-ready** — OAuth, UI extension cards, listing copy in `marketplace/listing.md`

## Architecture

```
HubSpot CRM record (company / contact)
        │
        ▼
  UI Extension card (React)
        │  hubspot.fetch() + portalId
        ▼
  app.hienergy.ai/hubspot/cards/*
        │  HubSpot signature validation
        │  portalId → API key lookup
        ▼
  Hi Energy REST API (https://app.hienergy.ai/api/v1)
        │  X-Api-Key
        ▼
  /search, /advertisers, /advertisers/search_by_domain, /contacts
```

Card and settings requests never expose the Hi Energy API key in the browser. HubSpot signs each `hubspot.fetch()` call; Hi Energy validates the signature server-side, resolves the portal’s API key, then calls the [public REST API](https://app.hienergy.ai/api_documentation) documented at `/api/v1`.

### Breeze Studio (agent tools)

```
Breeze Studio agent
        │
        ▼
  Hi Energy AI agent tools (workflow-actions)
        │  HubSpot-signed POST
        ▼
  app.hienergy.ai/hubspot/breeze/tools/*
        │  X-Api-Key + MCP tools/call
        ▼
  https://app.hienergy.ai/mcp
```

Deploy the webhook service in `breeze/` on Hi Energy infrastructure before publishing workflow actions.

## Prerequisites

- [HubSpot developer account](https://developers.hubspot.com/)
- [HubSpot CLI](https://developers.hubspot.com/docs/developer-tooling/local-development/hubspot-cli/install-the-cli)
- Hi Energy AI **API key**

## Quick start

```bash
cd hienergy-hubspot-app
npm install
npm ci --prefix src/app/cards
npm ci --prefix src/app/settings
npm ci --prefix src/app/app.functions
cp .env.example .env   # local reference only
hs account auth
npm run validate
npm run upload
```

### Connect Hi Energy in HubSpot

After install: **Connected apps → Hi Energy AI → Settings → Save and test connection**

For development, you can also configure portal credentials on the Hi Energy backend:

| Variable | Purpose |
|----------|---------|
| `HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL` | Production portal → API key lookup |
| `HIENERGY_HUBSPOT_PORTAL_KEYS` | Dev-only JSON map (`{"48470442":"your-key"}`) |
| `HIENERGY_API_BASE` | `https://app.hienergy.ai/api/v1` (REST API base URL) |
| `HUBSPOT_CLIENT_SECRET` | Validates HubSpot-signed card/settings requests |

### Add CRM cards

1. Open a company or contact record → **Customize** → **Default view**
2. **Card library** → filter **App**
3. Add **Hi Energy company research**, **Research company**, and/or **Hi Energy contact search**

## Project layout

```
hienergy-hubspot-app/
├── .github/workflows/
│   ├── ci.yml                   # PR lint + test + project validate
│   └── deploy.yml               # main → HubSpot upload (auto-deploy)
├── hsproject.json
├── src/app/
│   ├── app-hsmeta.json          # OAuth app, marketplace distribution
│   ├── app-logo.png             # Marketplace logo (from Chrome extension)
│   ├── cards/
│   │   ├── CompanyCard.jsx
│   │   ├── CompanyResearchSidebar.jsx
│   │   ├── ContactCard.jsx
│   │   └── lib/
│   │       ├── companyResearch.js   # hubspot.fetch wrappers
│   │       ├── researchUtils.js     # pure helpers (unit tested)
│   │       └── ResearchResults.jsx  # shared result UI
│   ├── settings/SettingsPage.jsx
│   ├── app.functions/lib/       # MCP client + signature helpers
│   └── workflow-actions/        # Breeze tools (isPublished: false)
├── breeze/                      # Hi Energy webhook service
│   ├── handlers.js              # /hubspot/cards, /settings, /breeze/tools
│   ├── portal-credentials.js
│   └── server.js
├── marketplace/
└── test/                        # 27 unit/integration tests
```

## CI/CD

GitHub Actions deploys to [Hi Energy HubSpot project](https://app.hubspot.com/developer-projects/48470442/project/hienergy-hubspot) on every push to `main`.

Add these repository secrets ([HubSpot GitHub Actions guide](https://developers.hubspot.com/docs/developer-tooling/third-party-tools/set-up-github-actions)):

| Secret | Value |
|--------|--------|
| `HUBSPOT_ACCOUNT_ID` | `48470442` |
| `HUBSPOT_PERSONAL_ACCESS_KEY` | Your HubSpot developer PAK |

Pull requests and every push run **Lint**, **Test**, and **HubSpot project validate** jobs. Pushes to `main` also deploy to HubSpot after those checks pass.

## OAuth scopes

- `oauth` — Marketplace install flow
- `crm.objects.companies.read` — company domain/name
- `crm.objects.contacts.read` — contact email/company

## Tests

```bash
npm run validate    # lint + all tests
npm test            # 27 tests across cards, MCP client, Breeze webhooks
npm run test:breeze # webhook handler tests only
```

Coverage includes:

- Card research helpers (`researchUtils`)
- Hi Energy MCP response formatting (`hienergy-client`)
- HubSpot signature validation (`hubspot-agent-tool`, `breeze/handlers`)
- Portal credential resolution (`portal-credentials`, `resolve-secrets`)
- Webhook HTTP server behavior (`breeze/server`)

## Marketplace submission

See [`marketplace/SUBMISSION_CHECKLIST.md`](marketplace/SUBMISSION_CHECKLIST.md) and [`marketplace/listing.md`](marketplace/listing.md).

Required Hi Energy backend endpoints before public launch:

- `POST /hubspot/settings` — persist portal API keys from settings page
- `POST /hubspot/settings/validate` — validate API keys
- `POST /hubspot/cards/universal-search`
- `POST /hubspot/cards/advertiser-by-domain`
- `POST /hubspot/cards/search-advertisers`
- `POST /hubspot/cards/search-contacts`
- `/hubspot/breeze/tools/*` — optional Breeze agent tools

## Environment

Copy `.env.example` for local reference. Production credentials live in **GitHub secrets**, **HubSpot app secrets**, and Hi Energy infrastructure — not in the repo.

## License

Proprietary — Hi Energy AI. Contact support@hienergy.ai for distribution terms.

# Hi Energy AI — HubSpot Marketplace App

HubSpot CRM integration for [Hi Energy AI](https://app.hienergy.ai). Shows advertisers, deals, and contacts from Hi Energy on **company** and **contact** record tabs — built for the [HubSpot Marketplace](https://ecosystem.hubspot.com/marketplace/).

Companion to the [Hi Energy Google Workspace add-on](https://github.com/HiEnergyAgency/hienergy-workspace-addon).

## Features

- **Company card** — Uses `domain` / `website` to find Hi Energy advertisers for that brand
- **Contact card** — Uses email domain or company name for universal search (advertisers, deals, contacts)
- **Serverless backend** — HubSpot app functions call Hi Energy MCP (`universal_search`, `search_advertisers_by_domain`) with your API key
- **Marketplace-ready** — OAuth, UI extension cards (not deprecated legacy CRM cards), listing copy in `marketplace/listing.md`

## Architecture

```
HubSpot CRM record (company / contact)
        │
        ▼
  UI Extension card (React)
        │  hubspot.serverless()
        ▼
  app.functions/hienergy-*.js
        │  X-Api-Key + MCP tools/call
        ▼
  https://app.hienergy.ai/mcp
```

## Prerequisites

- [HubSpot developer account](https://developers.hubspot.com/)
- [HubSpot CLI](https://developers.hubspot.com/docs/developer-tooling/local-development/hubspot-cli/install-the-cli) (`npm install -g @hubspot/cli`)
- Hi Energy AI **API key** (from your Hi Energy account)

## Quick start

```bash
cd hienergy-hubspot-app
npm install
cd src/app/extensions && npm install && cd ../../..
cd src/app/app.functions && npm install && cd ../../..
```

### 1. Authenticate HubSpot CLI

```bash
hs account auth
```

### 2. Create or link a HubSpot app

In [HubSpot Developer](https://app.hubspot.com/developer):

1. Create a new **app** (Developer platform 2025.2+)
2. Note the app ID and configure OAuth redirect URLs
3. Link this project: `hs project upload` from this directory

### 3. Set app secrets

In the HubSpot app settings → **Secrets**:

| Secret | Value |
|--------|--------|
| `HIENERGY_API_KEY` | Your Hi Energy API key |
| `HIENERGY_MCP_URL` | `https://app.hienergy.ai/mcp` (optional) |

### 4. Upload and test

```bash
npm run dev    # local dev loop
npm run upload # deploy to HubSpot
```

Open a **company** or **contact** in HubSpot CRM → **Hi Energy AI** tab.

## Project layout

```
hienergy-hubspot-app/
├── hsproject.json
├── src/app/
│   ├── app-hsmeta.json          # App config, OAuth scopes, permitted URLs
│   ├── extensions/
│   │   ├── CompanyCard.jsx      # CRM card on companies
│   │   ├── ContactCard.jsx      # CRM card on contacts
│   │   └── *-hsmeta.json
│   └── app.functions/
│       ├── hienergy-search.js
│       ├── hienergy-advertiser-by-domain.js
│       └── lib/hienergy-client.js
├── marketplace/listing.md
└── test/
```

## OAuth scopes

- `crm.objects.companies.read` — read company domain/name
- `crm.objects.contacts.read` — read contact email/company
- `oauth` — Marketplace install flow

Hi Energy scopes (Gmail, Sheets, etc.) are **not** requested — only Hi Energy API via server-side key.

## Marketplace submission

1. Complete [listing requirements](https://developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/app-marketplace-listing-requirements)
2. Use copy from `marketplace/listing.md`
3. Upload 1280×800 screenshots of company + contact cards
4. Submit for [HubSpot Ecosystem Quality review](https://ecosystem.hubspot.com/marketplace/)

See also: [OAuth quickstart](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/oauth/oauth-quickstart-guide), [UI extensions examples](https://github.com/hubspotdev/ui-extensions-examples).

## Tests

```bash
npm test
```

## Environment

Copy `.env.example` for local reference. Production credentials live in **HubSpot app secrets**, not in the repo.

## License

Proprietary — Hi Energy AI. Contact support@hienergy.ai for distribution terms.

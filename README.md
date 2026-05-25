# Hi Energy AI — HubSpot Marketplace App

HubSpot CRM integration for [Hi Energy AI](https://app.hienergy.ai). Shows advertisers, deals, and contacts from Hi Energy on **company** and **contact** record tabs — built for the [HubSpot Marketplace](https://ecosystem.hubspot.com/marketplace/).

Companion to the [Hi Energy Google Workspace add-on](https://github.com/HiEnergyAgency/hienergy-workspace-addon).

## Features

- **Company card** — Uses `domain` / `website` to find Hi Energy advertisers for that brand
- **Research company button** — Sidebar card on company records with a one-click Hi Energy research action
- **Contact card** — Uses email domain or company name for universal search (advertisers, deals, contacts)
- **Serverless backend** — HubSpot app functions call Hi Energy MCP (`universal_search`, `search_advertisers_by_domain`) with your API key
- **Breeze agent tools** — After install, add Hi Energy AI tools to Breeze Studio agents (search, domain lookup, reports) backed by the same MCP server
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

### Breeze Studio (agent tools)

HubSpot Breeze agents can call Hi Energy MCP tools through **agent tools** registered by this app. Each tool POSTs to Hi Energy webhooks that proxy to the MCP server.

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

**Setup**

1. Install the Hi Energy AI HubSpot app and set `HIENERGY_API_KEY` in app secrets (same as CRM cards).
2. Deploy the Breeze webhook service from `breeze/` to Hi Energy infrastructure and route these paths:
   - `/hubspot/breeze/tools/universal-search`
   - `/hubspot/breeze/tools/advertiser-by-domain`
   - `/hubspot/breeze/tools/search-advertisers`
   - `/hubspot/breeze/tools/recommend-report`
3. Configure webhook env vars:
   - `HUBSPOT_CLIENT_SECRET` — your HubSpot app client secret (signature validation)
   - `HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL` — Hi Energy endpoint that maps HubSpot `portalId` → API key (recommended for production)
   - or `HIENERGY_HUBSPOT_PORTAL_KEYS` JSON map for local testing
4. Upload the project: `npm run upload`
5. In HubSpot: **Breeze → Breeze Studio → Configure agent → Add tool → App tools → Hi Energy AI**

**Direct MCP connection (optional)**

You can also connect Breeze agents directly to the Hi Energy MCP server using a tokenized URL (Streamable HTTP), similar to Zapier:

`https://app.hienergy.ai/mcp?api_key=YOUR_API_KEY`

See [Hi Energy MCP docs](https://app.hienergy.ai/api_documentation/mcp) for OAuth and API-key options.

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

On **company** records, add the **Research company** sidebar card:

1. Open a company record → **Customize** (top of middle column) → **Default view**
2. In the right sidebar, open **Card library** → filter **App**
3. Add **Research company** (Hi Energy AI)

The sidebar card shows a **Research company** button on every company page. The Hi Energy AI tab shows the same action with full results.

## Project layout

```
hienergy-hubspot-app/
├── hsproject.json
├── src/app/
│   ├── app-hsmeta.json          # App config, OAuth scopes, permitted URLs
│   ├── extensions/
│   │   ├── CompanyCard.jsx      # CRM tab on companies
│   │   ├── CompanyResearchSidebar.jsx  # Research company button (sidebar)
│   │   ├── ContactCard.jsx      # CRM card on contacts
│   │   └── *-hsmeta.json
│   └── app.functions/
│       ├── hienergy-search.js
│       ├── hienergy-advertiser-by-domain.js
│       ├── lib/hienergy-client.js
│       └── lib/hubspot-agent-tool.js
│   └── workflow-actions/        # Breeze agent tools
│       └── hienergy-*-hsmeta.json
├── breeze/                      # Webhook service for Breeze agent tools
│   ├── handlers.js
│   ├── portal-credentials.js
│   └── server.js
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

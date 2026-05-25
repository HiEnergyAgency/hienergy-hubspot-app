# HubSpot Marketplace listing — Hi Energy AI

Submit at [HubSpot Marketplace](https://ecosystem.hubspot.com/marketplace/) after completing `marketplace/SUBMISSION_CHECKLIST.md`.

## App name

**Hi Energy AI**

## Tagline (≤80 chars)

Search affiliate advertisers and deals from HubSpot CRM records

## Short description

Connect Hi Energy AI to HubSpot. Research companies and contacts from CRM records to see matching advertisers, deals, and contacts — powered by the same MCP search as the Hi Energy Workspace add-on.

## Long description

Hi Energy AI brings affiliate marketing intelligence into HubSpot CRM.

**Company records** — Click **Research company** from the record sidebar or Hi Energy AI tab. Hi Energy searches by company domain or name and returns matching advertisers and related deals.

**Contact records** — The Hi Energy AI tab uses the contact email domain or company name to search advertisers, deals, and contacts.

**One connection** — Install the app, add your Hi Energy API key in **Connected apps → Hi Energy AI → Settings**, and your team can research from HubSpot without leaving CRM.

**Open in Hi Energy** — Every result links to the advertiser or deal in Hi Energy AI for deeper research.

Built for partnership managers and affiliate teams who use HubSpot for pipeline tracking and Hi Energy AI for program data.

## Category

CRM / Sales

## Pricing

Requires an active Hi Energy AI subscription with API access. Pricing must match the plans published on [hienergy.ai](https://hienergy.ai) that include API/MCP access. Do not list plans that cannot use the HubSpot integration.

Suggested listing plan copy:

- **Paid plans** — Hi Energy AI subscription with API access required to connect HubSpot.

## Install button URL

Use your live Marketplace listing URL after approval, for example:

`https://ecosystem.hubspot.com/marketplace/apps/hi-energy-ai`

Until listed, use your HubSpot app install link from the developer portal.

## Setup documentation URL

Publish `marketplace/setup-guide.md` at a public HTTPS URL, for example:

`https://app.hienergy.ai/integrations/hubspot`

## Support & legal

| Field | URL |
|-------|-----|
| Support | https://app.hienergy.ai |
| Support email | support@hienergy.ai |
| Documentation | https://app.hienergy.ai/api_documentation/mcp |
| Privacy | https://app.hienergy.ai/privacy_policy |
| Terms | https://app.hienergy.ai/terms_of_service |
| Website | https://hienergy.ai |

## OAuth scopes (shared data table)

| Scope | Direction | Data | Why |
|-------|-----------|------|-----|
| `crm.objects.companies.read` | HubSpot → app | Company name, domain, website | Build Hi Energy search queries on company records |
| `crm.objects.contacts.read` | HubSpot → app | Contact email, company, name | Build Hi Energy search queries on contact records |

Hi Energy search results are displayed in app cards. Hi Energy data is fetched server-side with the customer’s API key and is **not** stored in HubSpot CRM properties by default.

## Screenshots (1280×800)

1. Company record with **Research company** sidebar or Hi Energy AI tab results
2. Contact record with Hi Energy AI universal search results
3. **Connected apps → Hi Energy AI → Settings** showing API key configuration

## Certification notes (2026)

- Uses **UI extension app cards** only — [requirements](https://developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/app-marketplace-listing-requirements)
- OAuth must use **v3 / 2026-03 token endpoints** for new listings
- Complete security questionnaire for token storage when applying for certification
- Breeze agent tools ship in the repo but remain **unpublished** until Hi Energy webhook endpoints are live

## Branding

- Capitalize **HubSpot** in all listing copy
- Do not use HubSpot logos in app card icons
- App card names: **Hi Energy AI**, **Research company**

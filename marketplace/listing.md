# HubSpot Marketplace listing — Hi Energy AI

Submit at [HubSpot Marketplace](https://ecosystem.hubspot.com/marketplace/) after app certification.

## App name

**Hi Energy AI**

## Tagline (≤80 chars)

Search affiliate advertisers and deals from HubSpot CRM records

## Short description

Connect Hi Energy AI to HubSpot. See matching advertisers, deals, and contacts on every company and contact record — powered by the same MCP search as the Hi Energy Workspace add-on.

## Long description

Hi Energy AI brings affiliate marketing intelligence into HubSpot CRM.

**Company records** — When viewing a company, the Hi Energy AI card reads the company domain and searches Hi Energy for matching advertisers and related deals.

**Contact records** — When viewing a contact, the card uses the email domain (or company name) to run universal search across advertisers, deals, and contacts.

**One connection** — Install the app, add your Hi Energy API key as an app secret, and every user in the portal sees live data without leaving HubSpot.

**Breeze agents** — Add Hi Energy AI tools to Breeze Studio agents for natural-language search, domain lookup, advertiser discovery, and report recommendations via the Hi Energy MCP server.

**Open in Hi Energy** — Every result links to the advertiser or deal in Hi Energy AI for deeper research.

Built for partnership managers and affiliate teams who use HubSpot for pipeline tracking and Hi Energy AI for program data.

## Category

CRM / Sales

## Support & legal

| Field | URL |
|-------|-----|
| Support | https://app.hienergy.ai |
| Documentation | https://app.hienergy.ai/api_documentation/mcp |
| Privacy | https://app.hienergy.ai/privacy_policy |
| Terms | https://app.hienergy.ai/terms_of_service |
| Website | https://hienergy.ai |

## OAuth scopes (shared data table)

| Scope | Why |
|-------|-----|
| `crm.objects.companies.read` | Read company domain/name to query Hi Energy |
| `crm.objects.contacts.read` | Read contact email/company to query Hi Energy |

Hi Energy data is fetched server-side with the customer's API key — not stored in HubSpot custom properties by default.

## Screenshots (1280×800)

1. Company record with Hi Energy AI card showing advertisers and deals
2. Contact record with universal search results
3. App settings / secrets configuration

## Certification notes (2026)

- Use **UI extension app cards** (not legacy CRM cards) — [requirements](https://developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/app-marketplace-listing-requirements)
- OAuth must use **v3 / 2026-03 token endpoints** for new listings
- Complete security questionnaire for token storage

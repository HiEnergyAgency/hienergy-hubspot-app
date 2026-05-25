# Hi Energy AI — HubSpot setup guide

Public setup documentation for the Hi Energy AI HubSpot integration. Publish this page at a stable URL (for example `https://app.hienergy.ai/integrations/hubspot`) and use that URL in your Marketplace listing.

## Overview

Hi Energy AI adds affiliate marketing intelligence to HubSpot CRM:

- **Company records** — Research advertisers and deals by domain or company name
- **Contact records** — Search advertisers, deals, and contacts from email domain or company
- **Research company button** — One-click research from the company record sidebar

Data is fetched from Hi Energy AI through a secure server-side connection. Hi Energy data is not written into HubSpot properties by default.

## Requirements

- A HubSpot account with permission to install Marketplace apps
- An active **Hi Energy AI** subscription with API access
- A Hi Energy **API key** ([create one in Hi Energy](https://app.hienergy.ai/api_documentation/api_key))
- HubSpot OAuth approval for:
  - `crm.objects.companies.read`
  - `crm.objects.contacts.read`

## Install the app

1. Open the [Hi Energy AI listing on the HubSpot Marketplace](https://ecosystem.hubspot.com/marketplace/) (use your live listing URL after approval).
2. Click **Install app** and choose the HubSpot account.
3. Review the requested scopes on the OAuth consent screen:

| Scope | Why Hi Energy AI needs it |
|-------|---------------------------|
| `crm.objects.companies.read` | Read company domain and name to research advertisers |
| `crm.objects.contacts.read` | Read contact email and company to run Hi Energy search |

4. Click **Connect app** to finish installation.

![Screenshot placeholder — OAuth consent screen showing company and contact read scopes]

## Connect your Hi Energy API key

1. In HubSpot, open **Marketplace** (grid icon) → **Connected apps**.
2. Click **Hi Energy AI**.
3. Open the **Settings** tab.
4. Paste your Hi Energy API key.
5. Click **Save and test connection**.

![Screenshot placeholder — Hi Energy AI app settings with API key field]

If validation succeeds, the integration is ready. If you see a warning about portal storage, contact [support@hienergy.ai](mailto:support@hienergy.ai).

### Where to get an API key

1. Sign in to [Hi Energy AI](https://app.hienergy.ai).
2. Open your account/API settings.
3. Create or copy an API key.
4. Full instructions: [Hi Energy API key documentation](https://app.hienergy.ai/api_documentation/api_key)

Treat your API key like a password. Do not share it in chat, email, or public tickets.

## Add CRM cards

App cards are not added automatically. After install, add them to your record views.

### Company tab — Hi Energy AI

1. Open **CRM → Companies** and open any company.
2. Click **Customize** at the top of the middle column → **Default view**.
3. Open the **Card library** tab → filter **App**.
4. Add **Hi Energy AI** to a company tab.
5. Save the view.

### Company sidebar — Research company

1. On the same customize screen, open the right sidebar **Card library**.
2. Filter **App** and add **Research company**.
3. Save the view.

### Contact tab — Hi Energy AI

1. Open **CRM → Contacts** and open any contact.
2. Click **Customize** → **Default view**.
3. In **Card library**, filter **App** and add **Hi Energy AI**.
4. Save the view.

![Screenshot placeholder — company record with Hi Energy AI results]

## Use the integration

### Research a company

1. Open a company with a **domain**, **website**, or **name** filled in.
2. In the **Research company** sidebar card, click **Research company**.
3. Review matching advertisers and open results in Hi Energy AI.

Or open the **Hi Energy AI** tab and click **Research company** for full results.

### Research from a contact

1. Open a contact with an **email** or **company** filled in.
2. Open the **Hi Energy AI** tab to run universal search across advertisers, deals, and contacts.

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Connect Hi Energy AI in Connected Apps → Settings” | Add your API key in **Connected apps → Hi Energy AI → Settings**. |
| No matches for a company | Confirm the company domain or name is populated in HubSpot. |
| No matches for a contact | Confirm email or company name is populated. |
| Cards missing from record | Add app cards through **Customize → Card library → App**. |
| Invalid API key | Regenerate the key in Hi Energy and save again in app settings. |

## Uninstall

1. In HubSpot, go to **Connected apps**.
2. Open **Hi Energy AI**.
3. Click **Uninstall**.

Hi Energy AI stops receiving new requests from that HubSpot account after uninstall.

## Support

| Resource | URL |
|----------|-----|
| Hi Energy support | https://app.hienergy.ai |
| Email | support@hienergy.ai |
| MCP / API docs | https://app.hienergy.ai/api_documentation/mcp |
| Privacy policy | https://app.hienergy.ai/privacy_policy |
| Terms of service | https://app.hienergy.ai/terms_of_service |

## Data handling summary

| Direction | Data |
|-----------|------|
| HubSpot → Hi Energy | Company domain/name and contact email/company name (for search queries only) |
| Hi Energy → HubSpot | Search results displayed in app cards (not stored in CRM properties by default) |
| Stored in HubSpot | OAuth tokens managed by HubSpot; API key stored per portal through Hi Energy’s HubSpot settings flow |

Hi Energy AI uses OAuth as its HubSpot authorization method and requests only the scopes required for CRM context shown above.

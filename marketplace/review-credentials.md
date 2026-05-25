# HubSpot Marketplace review credentials — Hi Energy AI

Paste this into the **Testing info → App review instructions** field when submitting the listing.

Replace bracketed placeholders before submission.

---

## App review instructions

Hi Energy AI connects HubSpot CRM to the Hi Energy affiliate intelligence platform. Reviewers can test the full install flow with the credentials below.

### 1. Install the app

1. Install **Hi Energy AI** on a test HubSpot account.
2. Complete OAuth consent for company and contact read scopes.

### 2. Connect Hi Energy

1. Open **Connected apps → Hi Energy AI → Settings**.
2. Paste the test API key below.
3. Click **Save and test connection**.
4. Confirm you see a success message.

**Test API key:** `[CREATE A DEDICATED REVIEWER KEY IN HI ENERGY — DO NOT USE PRODUCTION CUSTOMER KEYS]`

### 3. Add CRM cards

Cards are not added automatically.

**Company record**

1. Open **CRM → Companies** and open a company with a domain (for example `nike.com`).
2. Customize the record view and add:
   - Tab card: **Hi Energy company research**
   - Sidebar card: **Research company**
3. Click **Research company** and confirm advertiser/contact results load.

**Contact record**

1. Open **CRM → Contacts** with an email populated.
2. Add tab card **Hi Energy contact search**.
3. Confirm search results load automatically.

### 4. Expected behavior

- Results appear in app cards with links to Hi Energy AI.
- Hi Energy data is displayed only in cards; it is not written to HubSpot properties.
- If the API key is missing, cards show guidance to open **Connected apps → Settings**.

### 5. Support during review

- Email: support@hienergy.ai
- Setup guide: https://app.hienergy.ai/integrations/hubspot
- API documentation: https://app.hienergy.ai/api_documentation

---

## Technology Partner contacts

| Role | Name | Email |
|------|------|-------|
| Main point of contact | [Your name] | [your@hienergy.ai] |
| Developer | [Engineering contact] | [dev@hienergy.ai] |
| Executive | [Optional] | [exec@hienergy.ai] |

---

## Notes for internal use before submit

- [ ] Reviewer API key created and tested against `/hubspot/settings/validate`
- [ ] Backend deployed at `app.hienergy.ai` with `HUBSPOT_CLIENT_SECRET` set
- [ ] Setup guide live at `/integrations/hubspot`
- [ ] Three 1280×800 screenshots captured
- [ ] Three unaffiliated production installs completed in last 30 days

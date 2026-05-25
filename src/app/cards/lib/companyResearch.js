import { hubspot } from '@hubspot/ui-extensions';
import {
  APP_ORIGIN,
  getCompanySearchContext,
  getContactSearchQuery,
  normalizeCompanyResearchBody
} from './researchUtils';

export {
  APP_ORIGIN,
  domainFromEmail,
  domainFromWebsite,
  getCompanySearchContext,
  getContactSearchQuery,
  normalizeCompanyResearchBody,
  researchSummary
} from './researchUtils';

const CARDS_BASE = `${APP_ORIGIN}/hubspot/cards`;

async function postCard(path, body, portalId) {
  const response = await hubspot.fetch(`${CARDS_BASE}${path}`, {
    method: 'POST',
    body: {
      ...body,
      ...(portalId != null ? { portalId } : {})
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      message: `Hi Energy request failed (${response.status}).`
    };
  }

  return response.json();
}

export async function researchCompany(properties = {}, portalId) {
  const { domain, query } = getCompanySearchContext(properties);

  if (!query) {
    return {
      ok: false,
      message: 'Add a company domain or name to research in Hi Energy AI.'
    };
  }

  const body = domain
    ? await postCard('/advertiser-by-domain', { domain }, portalId)
    : await postCard(
        '/universal-search',
        {
          query,
          types: 'advertisers,deals,contacts',
          perTypeLimit: 5
        },
        portalId
      );

  return normalizeCompanyResearchBody(body);
}

export async function researchContact(properties = {}, portalId) {
  const { domain, query } = getContactSearchQuery(properties);

  if (!query) {
    return {
      ok: false,
      message: 'Add an email or company to search Hi Energy AI.'
    };
  }

  const body = await postCard(
    '/universal-search',
    {
      query: domain || query,
      types: 'advertisers,deals,contacts',
      perTypeLimit: 5
    },
    portalId
  );

  return normalizeCompanyResearchBody(body);
}

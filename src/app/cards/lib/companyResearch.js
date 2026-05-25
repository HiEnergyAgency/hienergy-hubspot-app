import { hubspot } from '@hubspot/ui-extensions';
import {
  APP_ORIGIN,
  getCompanySearchContext,
  getContactSearchQueries,
  mergeResearchBodies,
  normalizeCompanyResearchBody,
  formatResearchError,
  SETTINGS_HINT
} from './researchUtils';

export {
  APP_ORIGIN,
  domainFromEmail,
  domainFromWebsite,
  getCompanySearchContext,
  getContactSearchQueries,
  getContactSearchQuery,
  mergeResearchBodies,
  normalizeCompanyResearchBody,
  researchSummary,
  formatResearchError,
  SETTINGS_HINT
} from './researchUtils';

const CARDS_BASE = `${APP_ORIGIN}/hubspot/cards`;
const DEFAULT_LIMIT = 5;

async function postCard(path, body, portalId) {
  const response = await hubspot.fetch(`${CARDS_BASE}${path}`, {
    method: 'POST',
    body: {
      ...body,
      ...(portalId != null ? { portalId } : {})
    }
  });

  if (!response.ok) {
    const message =
      response.status === 401
        ? 'Hi Energy could not verify this HubSpot request.'
        : `Hi Energy request failed (${response.status}).`;
    return {
      ok: false,
      message: formatResearchError(message)
    };
  }

  return response.json();
}

async function searchAdvertisers(query, portalId, limit = DEFAULT_LIMIT) {
  if (!query) return null;
  return postCard('/search-advertisers', { query, limit }, portalId);
}

async function searchContacts(query, portalId, limit = DEFAULT_LIMIT) {
  if (!query) return null;
  return postCard('/search-contacts', { query, limit }, portalId);
}

async function searchAdvertisersByDomain(domain, portalId) {
  if (!domain) return null;
  return postCard('/advertiser-by-domain', { domain }, portalId);
}

export async function researchCompany(properties = {}, portalId) {
  const { domain, query } = getCompanySearchContext(properties);

  if (!query) {
    return {
      ok: false,
      message: 'Add a company domain or name to research in Hi Energy AI.'
    };
  }

  const requests = [];

  if (domain) {
    requests.push(searchAdvertisersByDomain(domain, portalId));
  }

  requests.push(searchAdvertisers(query, portalId));
  requests.push(searchContacts(query, portalId));

  const bodies = (await Promise.all(requests)).filter(Boolean);
  const merged = mergeResearchBodies(bodies);

  if (!merged.ok) {
    return merged;
  }

  if (!merged.sections.length) {
    const fallback = await postCard(
      '/universal-search',
      {
        query,
        types: 'advertisers,contacts',
        perTypeLimit: DEFAULT_LIMIT
      },
      portalId
    );
    return normalizeCompanyResearchBody(fallback);
  }

  return { ok: true, sections: merged.sections, query };
}

export async function researchContact(properties = {}, portalId) {
  const { contactQuery, advertiserQuery, domain, email, name } =
    getContactSearchQueries(properties);

  if (!contactQuery && !advertiserQuery) {
    return {
      ok: false,
      message: 'Add an email or company to search Hi Energy AI.'
    };
  }

  const requests = [];

  if (contactQuery) {
    requests.push(searchContacts(contactQuery, portalId));
  }

  if (email && email !== contactQuery) {
    requests.push(searchContacts(email, portalId));
  }

  if (name && name !== contactQuery) {
    requests.push(searchContacts(name, portalId));
  }

  if (domain) {
    requests.push(searchAdvertisersByDomain(domain, portalId));
  }

  if (advertiserQuery) {
    requests.push(searchAdvertisers(advertiserQuery, portalId));
  }

  const bodies = (await Promise.all(requests)).filter(Boolean);
  const merged = mergeResearchBodies(bodies);

  if (!merged.ok) {
    return merged;
  }

  if (!merged.sections.length) {
    const fallbackQuery = domain || contactQuery || advertiserQuery;
    const fallback = await postCard(
      '/universal-search',
      {
        query: fallbackQuery,
        types: 'advertisers,contacts',
        perTypeLimit: DEFAULT_LIMIT
      },
      portalId
    );
    return normalizeCompanyResearchBody(fallback);
  }

  return { ok: true, sections: merged.sections, query: contactQuery || advertiserQuery };
}

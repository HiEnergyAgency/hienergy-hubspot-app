import { hubspot } from '@hubspot/ui-extensions';

export const APP_ORIGIN = 'https://app.hienergy.ai';

export function domainFromWebsite(website) {
  let raw = String(website || '').trim();
  if (!raw) return '';
  try {
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    return new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return raw.replace(/^www\./, '').split('/')[0].toLowerCase();
  }
}

export function getCompanySearchContext(properties = {}) {
  const domain = domainFromWebsite(properties.domain || properties.website);
  const query = domain || properties.name || '';
  const label = domain
    ? `Domain: ${domain}`
    : query
      ? `Company: ${query}`
      : 'Add a domain or company name to research.';

  return { domain, query, label };
}

function normalizeCompanyResearchBody(body) {
  if (!body?.ok) {
    return {
      ok: false,
      message: body?.message || 'Hi Energy request failed.'
    };
  }

  if (body.advertisers) {
    return {
      ok: true,
      sections: [
        {
          type: 'advertisers',
          total: body.advertisers.length,
          rows: body.advertisers
        }
      ],
      query: body.domain || null
    };
  }

  return {
    ok: true,
    sections: body.sections || [],
    query: body.query || null
  };
}

export async function researchCompany(properties = {}) {
  const { domain, query } = getCompanySearchContext(properties);

  if (!query) {
    return {
      ok: false,
      message: 'Add a company domain or name to research in Hi Energy AI.'
    };
  }

  const fn = domain ? 'hienergyAdvertiserByDomain' : 'hienergySearch';
  const params = domain
    ? { domain }
    : { query, types: 'advertisers,deals,contacts', perTypeLimit: 5 };

  const response = await hubspot.serverless(fn, { parameters: params });
  const body = response?.body || response;
  return normalizeCompanyResearchBody(body);
}

export function researchSummary(data) {
  const sections = data?.sections || [];
  if (!sections.length) return 'No Hi Energy matches found.';

  return sections
    .map((section) => {
      const count = section.total ?? section.rows?.length ?? 0;
      return `${count} ${section.type.replace(/_/g, ' ')}`;
    })
    .join(', ');
}

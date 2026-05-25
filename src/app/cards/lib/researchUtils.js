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

export function domainFromEmail(email) {
  const m = String(email || '').match(/@([^@\s]+)/);
  return m ? m[1].toLowerCase() : '';
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

export function getContactSearchQuery(properties = {}) {
  const email = properties.email || '';
  const domain = domainFromEmail(email);
  const query =
    domain ||
    properties.company ||
    [properties.firstname, properties.lastname].filter(Boolean).join(' ');

  return { domain, query, email };
}

export function normalizeCompanyResearchBody(body) {
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

export function formatSectionTitle(section) {
  const base =
    section.type.charAt(0).toUpperCase() +
    section.type.slice(1).replace(/_/g, ' ');
  return section.total ? `${base} · ${section.total}` : base;
}

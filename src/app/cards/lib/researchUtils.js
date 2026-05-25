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
  const queries = getContactSearchQueries(properties);
  return {
    domain: queries.domain,
    query: queries.contactQuery,
    email: queries.email
  };
}

export function getContactSearchQueries(properties = {}) {
  const email = properties.email || '';
  const domain = domainFromEmail(email);
  const name = [properties.firstname, properties.lastname].filter(Boolean).join(' ');
  const company = properties.company || '';

  return {
    email,
    domain,
    name,
    company,
    contactQuery: email || name || company,
    advertiserQuery: domain || company || name
  };
}

export function mergeResearchBodies(bodies = []) {
  const sections = [];
  const seen = new Set();
  let firstError = null;

  for (const body of bodies) {
    const normalized = normalizeCompanyResearchBody(body);
    if (!normalized.ok) {
      firstError = firstError || normalized;
      continue;
    }

    for (const section of normalized.sections || []) {
      let merged = sections.find((entry) => entry.type === section.type);
      if (!merged) {
        merged = {
          type: section.type,
          total: 0,
          rows: []
        };
        sections.push(merged);
      }

      for (const row of section.rows || []) {
        const rowKey = `${section.type}:${row.id || row.label}`;
        if (seen.has(rowKey)) continue;
        seen.add(rowKey);
        merged.rows.push(row);
      }

      merged.total = merged.rows.length;
    }
  }

  if (!sections.length && firstError) {
    return firstError;
  }

  return { ok: true, sections };
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

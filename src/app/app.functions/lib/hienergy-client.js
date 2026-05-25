/**
 * Hi Energy client for HubSpot cards and Breeze webhooks.
 * Uses the public REST API (https://app.hienergy.ai/api/v1) as the primary
 * integration path, with MCP fallback for compatibility.
 */

const {
  apiRequest,
  extractListRows,
  normalizeUniversalSearchBody
} = require('./hienergy-api');

const DEFAULT_MCP_URL = 'https://app.hienergy.ai/mcp';
const MCP_PROTOCOL = '2025-11-25';
const CLIENT_NAME = 'Hi Energy AI HubSpot';
const CLIENT_VERSION = '1.0.0';

function cleanArgs(args) {
  const out = {};
  Object.keys(args || {}).forEach((key) => {
    const v = args[key];
    if (v !== undefined && v !== null && v !== '') {
      out[key] = v;
    }
  });
  return out;
}

function parseMcpBody(result) {
  if (!result) return null;
  if (result.structuredContent != null) return result.structuredContent;
  const content = result.content;
  if (!Array.isArray(content)) return result;
  for (const item of content) {
    if (item && item.text) {
      try {
        return JSON.parse(item.text);
      } catch {
        return { text: item.text };
      }
    }
  }
  return result;
}

function normalizeSearchBody(body) {
  return normalizeUniversalSearchBody(body);
}

function attrs(record) {
  if (!record || typeof record !== 'object') return {};
  if (record.attributes && typeof record.attributes === 'object') {
    return record.attributes;
  }
  const attrsOut = {};
  Object.keys(record).forEach((k) => {
    if (k !== 'id' && k !== 'type') attrsOut[k] = record[k];
  });
  return attrsOut;
}

function rowLabel(type, row) {
  const a = attrs(row);
  if (type === 'advertisers') {
    return a.display_name || a.name || row.id || 'Advertiser';
  }
  if (type === 'deals') {
    return a.title || a.name || row.id || 'Deal';
  }
  if (type === 'contacts' || type === 'advertiser_contacts') {
    const given = a.given_name || a.givenName || '';
    const family = a.family_name || a.familyName || '';
    return [given, family].filter(Boolean).join(' ') || a.email || row.id || 'Contact';
  }
  if (type === 'transactions') {
    return a.advertiser_name || row.id || 'Transaction';
  }
  return String(row.id || type);
}

function rowSubtitle(type, row) {
  const a = attrs(row);
  if (type === 'advertisers') {
    return [a.program_status || a.status, a.publisher_name, a.domain, a.network_name]
      .filter(Boolean)
      .join(' · ');
  }
  if (type === 'deals') {
    return [a.advertiser_name, a.status, a.country].filter(Boolean).join(' · ');
  }
  if (type === 'contacts' || type === 'advertiser_contacts') {
    return [a.advertiser_name, a.email, a.job_title || a.title].filter(Boolean).join(' · ');
  }
  if (type === 'transactions') {
    return [a.commission_amount || a.commission, a.network_name, a.status]
      .filter(Boolean)
      .join(' · ');
  }
  return '';
}

function summarizeForCard(body, limitPerType) {
  const normalized = normalizeSearchBody(body);
  const sections = [];
  const order = ['advertisers', 'deals', 'transactions', 'contacts', 'advertiser_contacts'];

  order.forEach((type) => {
    const bucket = normalized.results[type];
    if (!bucket) return;
    const rows = bucket.data || (Array.isArray(bucket) ? bucket : []);
    if (!rows.length) return;
    const total = bucket.total ?? rows.length;
    sections.push({
      type,
      total,
      rows: rows.slice(0, limitPerType).map((row) => ({
        id: row.id,
        label: rowLabel(type, row),
        subtitle: rowSubtitle(type, row),
        adminUrl: adminUrl(type, row)
      }))
    });
  });

  return { sections, query: body?.query || null };
}

function summarizeToolListForCard(type, body, limit) {
  const rows = extractListRows(body);
  if (!rows.length) return null;

  const capped = rows.slice(0, limit);
  return {
    type,
    total: body?.meta?.total_count ?? body?.total ?? rows.length,
    rows: capped.map((row) => ({
      id: row.id,
      label: rowLabel(type, row),
      subtitle: rowSubtitle(type, row),
      adminUrl: adminUrl(type, row)
    }))
  };
}

function summarizeToolListResponse(type, body, limit, query) {
  const section = summarizeToolListForCard(type, body, limit);
  if (!section) {
    return { ok: true, sections: [], query: query || null };
  }
  return { ok: true, sections: [section], query: query || null };
}

function adminUrl(type, row) {
  const origin = process.env.HIENERGY_APP_ORIGIN || 'https://app.hienergy.ai';
  const a = attrs(row);
  const id = row.id || a.slug;

  if (type === 'advertisers') {
    const slug = a.slug || id;
    return slug ? `${origin}/a/${encodeURIComponent(slug)}` : origin;
  }
  if (type === 'deals' && id) {
    return `${origin}/admin/deals/${encodeURIComponent(id)}`;
  }
  if (type === 'contacts' && id) {
    return `${origin}/admin/contacts/${encodeURIComponent(id)}`;
  }
  return origin;
}

function looksLikeDomain(value) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(String(value || '').trim());
}

async function validateApiKey(apiKey, secrets = {}) {
  const key = String(apiKey || '').trim();
  if (!key) {
    return { ok: false, error: 'MISSING_API_KEY', message: 'Enter your Hi Energy API key.' };
  }

  const tools = await apiRequest('/tools', secrets, { apiKey: key });
  if (tools.ok) {
    return { ok: true, message: 'Hi Energy API key is valid.' };
  }

  const mcpUrl = (secrets.HIENERGY_MCP_URL || DEFAULT_MCP_URL).replace(/\/$/, '');
  const initRes = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'MCP-Protocol-Version': MCP_PROTOCOL,
      'X-Api-Key': key
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: MCP_PROTOCOL,
        clientInfo: { name: CLIENT_NAME, version: CLIENT_VERSION }
      }
    })
  });

  if (!initRes.ok) {
    return {
      ok: false,
      error: 'API_KEY_INVALID',
      message: tools.message || `Hi Energy rejected this API key (${initRes.status}).`
    };
  }

  return { ok: true, message: 'Hi Energy API key is valid.' };
}

async function callMcpTool(toolName, toolArgs, secrets) {
  const mcpUrl = (secrets.HIENERGY_MCP_URL || DEFAULT_MCP_URL).replace(/\/$/, '');
  const apiKey = secrets.HIENERGY_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'MISSING_API_KEY', message: 'Connect Hi Energy AI in Connected Apps → Settings.' };
  }

  const headers = {
    'Content-Type': 'application/json',
    'MCP-Protocol-Version': MCP_PROTOCOL,
    'X-Api-Key': apiKey
  };

  const initRes = await fetch(mcpUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: MCP_PROTOCOL,
        clientInfo: { name: CLIENT_NAME, version: CLIENT_VERSION }
      }
    })
  });
  if (!initRes.ok) {
    return {
      ok: false,
      error: 'MCP_INIT_FAILED',
      message: `Hi Energy initialize failed (${initRes.status})`
    };
  }

  const callRes = await fetch(mcpUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: cleanArgs(toolArgs)
      }
    })
  });
  const text = await callRes.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }

  if (!callRes.ok) {
    return {
      ok: false,
      code: callRes.status,
      error: 'MCP_HTTP_ERROR',
      message: payload?.error?.message || `Hi Energy request failed (${callRes.status})`
    };
  }

  if (payload.error) {
    return {
      ok: false,
      error: 'MCP_RPC_ERROR',
      message: payload.error.message || 'MCP tool call failed'
    };
  }

  return { ok: true, body: parseMcpBody(payload.result) };
}

async function withRestThenMcp(restFn, mcpFn) {
  const rest = await restFn();
  if (rest.ok) return rest;
  return mcpFn();
}

async function universalSearch(query, secrets, options) {
  const q = String(query || '').trim();
  if (!q) {
    return { ok: false, error: 'MISSING_QUERY', message: 'No search query.' };
  }

  const perTypeLimit = options?.perTypeLimit ?? 5;
  const types = options?.types ?? 'advertisers,contacts';

  const result = await withRestThenMcp(
    () =>
      apiRequest('/search', secrets, {
        query: cleanArgs({
          q,
          per_type_limit: perTypeLimit,
          types
        })
      }),
    () =>
      callMcpTool(
        'universal_search',
        cleanArgs({
          q,
          per_type_limit: perTypeLimit,
          types
        }),
        secrets
      )
  );

  if (!result.ok) return result;

  const card = summarizeForCard(normalizeSearchBody(result.body), perTypeLimit);
  return { ok: true, ...card, query: q };
}

async function advertiserByDomain(domain, secrets) {
  const d = String(domain || '').trim().toLowerCase();
  if (!d) {
    return { ok: false, error: 'MISSING_DOMAIN', message: 'No domain on record.' };
  }

  const result = await withRestThenMcp(
    () =>
      apiRequest('/advertisers/search_by_domain', secrets, {
        query: { domain: d, limit: 5 }
      }),
    () => callMcpTool('search_advertisers_by_domain', { domain: d }, secrets)
  );

  if (!result.ok) return result;

  const rows = extractListRows(result.body).slice(0, 5);
  const advertisers = rows.map((row) => ({
    id: row.id,
    label: rowLabel('advertisers', row),
    subtitle: rowSubtitle('advertisers', row),
    adminUrl: adminUrl('advertisers', row)
  }));

  return { ok: true, domain: d, advertisers };
}

function domainFromEmail(email) {
  const m = String(email || '').match(/@([^@\s]+)/);
  return m ? m[1].toLowerCase() : '';
}

function domainFromWebsite(website) {
  let raw = String(website || '').trim();
  if (!raw) return '';
  try {
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    return new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return raw.replace(/^www\./, '').split('/')[0].toLowerCase();
  }
}

async function searchAdvertisers(query, secrets, options) {
  const q = String(query || '').trim();
  if (!q) {
    return { ok: false, error: 'MISSING_QUERY', message: 'No advertiser search query.' };
  }

  const limit = options?.limit ?? 10;
  const result = await withRestThenMcp(
    () =>
      apiRequest('/advertisers', secrets, {
        query: cleanArgs({
          q,
          name: q,
          vertical: options?.vertical,
          network: options?.network,
          country: options?.country,
          limit
        })
      }),
    () =>
      callMcpTool(
        'search_advertisers',
        cleanArgs({
          name: q,
          vertical: options?.vertical,
          network: options?.network,
          country: options?.country,
          limit
        }),
        secrets
      )
  );

  if (!result.ok) return result;
  return summarizeToolListResponse('advertisers', result.body, limit, q);
}

async function searchContacts(query, secrets, options) {
  const q = String(query || '').trim();
  if (!q) {
    return { ok: false, error: 'MISSING_QUERY', message: 'No contact search query.' };
  }

  const limit = options?.limit ?? options?.perTypeLimit ?? 10;
  const contactQuery = looksLikeDomain(q)
    ? { advertiser_domain: q, limit }
    : cleanArgs({ q, email: q.includes('@') ? q : undefined, limit });

  const result = await withRestThenMcp(
    () => apiRequest('/contacts', secrets, { query: contactQuery }),
    () =>
      callMcpTool(
        'search_contacts',
        cleanArgs({
          q,
          page: options?.page,
          limit
        }),
        secrets
      )
  );

  if (!result.ok) return result;
  return summarizeToolListResponse('contacts', result.body, limit, q);
}

async function searchAdvertisersRaw(query, secrets, options) {
  const q = String(query || '').trim();
  if (!q) {
    return { ok: false, error: 'MISSING_QUERY', message: 'No advertiser search query.' };
  }

  const limit = options?.limit ?? 10;
  const result = await withRestThenMcp(
    () =>
      apiRequest('/advertisers', secrets, {
        query: cleanArgs({
          q,
          name: q,
          vertical: options?.vertical,
          network: options?.network,
          country: options?.country,
          limit
        })
      }),
    () =>
      callMcpTool(
        'search_advertisers',
        cleanArgs({
          name: q,
          vertical: options?.vertical,
          network: options?.network,
          country: options?.country,
          limit
        }),
        secrets
      )
  );

  if (!result.ok) return result;
  return { ok: true, body: result.body };
}

async function recommendReport(goal, secrets, options) {
  const g = String(goal || '').trim();
  if (!g) {
    return { ok: false, error: 'MISSING_GOAL', message: 'No report goal provided.' };
  }

  return callMcpTool(
    'recommend_report',
    cleanArgs({
      goal: g,
      period: options?.period
    }),
    secrets
  );
}

module.exports = {
  callMcpTool,
  validateApiKey,
  universalSearch,
  advertiserByDomain,
  searchAdvertisers,
  searchAdvertisersRaw,
  searchContacts,
  recommendReport,
  domainFromEmail,
  domainFromWebsite,
  summarizeForCard,
  summarizeToolListForCard,
  summarizeToolListResponse,
  rowLabel,
  rowSubtitle,
  parseMcpBody,
  normalizeSearchBody
};

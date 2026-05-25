/**
 * Hi Energy MCP / REST client for HubSpot serverless functions.
 * Mirrors hienergy-workspace-addon ApiClient + McpClient patterns.
 */

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
  if (!body || typeof body !== 'object') return { results: {} };
  const container = body.data?.results ? body.data : body.structuredContent || body;
  const results = container.results || {};
  return { results };
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

async function callMcpTool(toolName, toolArgs, secrets) {
  const mcpUrl = (secrets.HIENERGY_MCP_URL || DEFAULT_MCP_URL).replace(/\/$/, '');
  const apiKey = secrets.HIENERGY_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'MISSING_API_KEY', message: 'Set HIENERGY_API_KEY in app secrets.' };
  }

  const headers = {
    'Content-Type': 'application/json',
    'MCP-Protocol-Version': MCP_PROTOCOL,
    'X-Api-Key': apiKey
  };

  const initPayload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: MCP_PROTOCOL,
      clientInfo: { name: CLIENT_NAME, version: CLIENT_VERSION }
    }
  };

  const initRes = await fetch(mcpUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(initPayload)
  });
  if (!initRes.ok) {
    return {
      ok: false,
      error: 'MCP_INIT_FAILED',
      message: `Hi Energy initialize failed (${initRes.status})`
    };
  }

  const callPayload = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: cleanArgs(toolArgs)
    }
  };

  const callRes = await fetch(mcpUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(callPayload)
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

  const body = parseMcpBody(payload.result);
  return { ok: true, body };
}

async function universalSearch(query, secrets, options) {
  const q = String(query || '').trim();
  if (!q) {
    return { ok: false, error: 'MISSING_QUERY', message: 'No search query.' };
  }

  const result = await callMcpTool(
    'universal_search',
    cleanArgs({
      q,
      per_type_limit: options?.perTypeLimit ?? 5,
      types: options?.types ?? 'advertisers,deals,contacts'
    }),
    secrets
  );

  if (!result.ok) return result;

  const card = summarizeForCard(result.body, options?.perTypeLimit ?? 5);
  return { ok: true, ...card, query: q };
}

async function advertiserByDomain(domain, secrets) {
  const d = String(domain || '').trim().toLowerCase();
  if (!d) {
    return { ok: false, error: 'MISSING_DOMAIN', message: 'No domain on record.' };
  }

  const result = await callMcpTool('search_advertisers_by_domain', { domain: d }, secrets);
  if (!result.ok) return result;

  const rows = result.body?.data || (Array.isArray(result.body) ? result.body : []);
  const advertisers = (Array.isArray(rows) ? rows : []).slice(0, 5).map((row) => ({
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

  return callMcpTool(
    'search_advertisers',
    cleanArgs({
      name: q,
      vertical: options?.vertical,
      network: options?.network,
      country: options?.country,
      limit: options?.limit ?? 10
    }),
    secrets
  );
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
  universalSearch,
  advertiserByDomain,
  searchAdvertisers,
  recommendReport,
  domainFromEmail,
  domainFromWebsite,
  summarizeForCard,
  rowLabel,
  rowSubtitle,
  parseMcpBody,
  normalizeSearchBody
};

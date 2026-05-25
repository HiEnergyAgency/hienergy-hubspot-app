const DEFAULT_API_BASE = 'https://app.hienergy.ai/api/v1';

function getApiBase(secrets = {}) {
  return (
    secrets.HIENERGY_API_BASE ||
    process.env.HIENERGY_API_BASE ||
    DEFAULT_API_BASE
  ).replace(/\/$/, '');
}

function getApiKey(secrets = {}, overrideKey) {
  const key = overrideKey != null ? overrideKey : secrets.HIENERGY_API_KEY;
  return key == null ? '' : String(key).trim();
}

function cleanQuery(query = {}) {
  const out = {};
  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      out[key] = value;
    }
  });
  return out;
}

function parseApiError(body, status) {
  const error = body?.error;
  if (error && typeof error === 'object') {
    return {
      ok: false,
      code: status,
      error: error.code || 'API_HTTP_ERROR',
      message: error.message || `Hi Energy API request failed (${status}).`
    };
  }
  if (typeof error === 'string') {
    return {
      ok: false,
      code: status,
      error: 'API_HTTP_ERROR',
      message: error
    };
  }
  return {
    ok: false,
    code: status,
    error: 'API_HTTP_ERROR',
    message: `Hi Energy API request failed (${status}).`
  };
}

async function apiRequest(path, secrets, options = {}) {
  const apiKey = getApiKey(secrets, options.apiKey);
  if (!apiKey) {
    return {
      ok: false,
      error: 'MISSING_API_KEY',
      message: 'Connect Hi Energy AI in Connected Apps → Settings.'
    };
  }

  const base = getApiBase(secrets);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  Object.entries(cleanQuery(options.query)).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const headers = {
    Accept: 'application/json',
    'X-Api-Key': apiKey
  };

  const init = {
    method: options.method || 'GET',
    headers
  };

  if (options.body != null) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), init);
  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    return parseApiError(body, response.status);
  }

  return { ok: true, code: response.status, body: body || {} };
}

function extractListRows(body) {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.contacts?.data)) return body.contacts.data;
  if (Array.isArray(body.advertisers?.data)) return body.advertisers.data;
  if (Array.isArray(body.deals?.data)) return body.deals.data;
  if (Array.isArray(body)) return body;
  return [];
}

function normalizeUniversalSearchBody(body) {
  if (!body || typeof body !== 'object') {
    return { results: {} };
  }

  const container =
    body.results != null
      ? body
      : body.data?.results != null
        ? body.data
        : body.structuredContent?.results != null
          ? body.structuredContent
          : body;

  return { results: container.results || {} };
}

module.exports = {
  DEFAULT_API_BASE,
  getApiBase,
  getApiKey,
  apiRequest,
  extractListRows,
  normalizeUniversalSearchBody,
  cleanQuery
};

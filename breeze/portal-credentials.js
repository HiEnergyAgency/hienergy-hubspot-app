const DEFAULT_MCP_URL = 'https://app.hienergy.ai/mcp';
const DEFAULT_API_BASE = 'https://app.hienergy.ai/api/v1';

async function resolveSecretsForPortal(portalId) {
  const id = portalId == null ? '' : String(portalId);
  if (!id) {
    throw new Error('Missing HubSpot portal ID on agent tool request.');
  }

  const lookupUrl = process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL;
  const lookupToken = process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_TOKEN;
  if (lookupUrl) {
    const url = lookupUrl.replace(/\/$/, '') + '/' + encodeURIComponent(id);
    const headers = { Accept: 'application/json' };
    if (lookupToken) headers.Authorization = `Bearer ${lookupToken}`;

    const res = await fetch(url, { headers });
    if (res.ok) {
      const payload = await res.json();
      const apiKey = payload.api_key || payload.apiKey || payload.HIENERGY_API_KEY;
      if (apiKey) {
        return {
          HIENERGY_API_KEY: apiKey,
          HIENERGY_API_BASE:
            payload.api_base ||
            payload.apiBase ||
            process.env.HIENERGY_API_BASE ||
            'https://app.hienergy.ai/api/v1',
          HIENERGY_MCP_URL: payload.mcp_url || payload.mcpUrl || process.env.HIENERGY_MCP_URL || DEFAULT_MCP_URL
        };
      }
    }
  }

  const mapJson = process.env.HIENERGY_HUBSPOT_PORTAL_KEYS;
  if (mapJson) {
    const map = JSON.parse(mapJson);
    const apiKey = map[id];
    if (apiKey) {
      return {
        HIENERGY_API_KEY: apiKey,
        HIENERGY_API_BASE: process.env.HIENERGY_API_BASE || DEFAULT_API_BASE,
        HIENERGY_MCP_URL: process.env.HIENERGY_MCP_URL || DEFAULT_MCP_URL
      };
    }
  }

  if (process.env.HIENERGY_API_KEY) {
    return {
      HIENERGY_API_KEY: process.env.HIENERGY_API_KEY,
      HIENERGY_API_BASE: process.env.HIENERGY_API_BASE || DEFAULT_API_BASE,
      HIENERGY_MCP_URL: process.env.HIENERGY_MCP_URL || DEFAULT_MCP_URL
    };
  }

  throw new Error(`No Hi Energy API key configured for HubSpot portal ${id}.`);
}

module.exports = {
  resolveSecretsForPortal
};

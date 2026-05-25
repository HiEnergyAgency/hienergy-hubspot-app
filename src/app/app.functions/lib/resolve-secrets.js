const DEFAULT_MCP_URL = 'https://app.hienergy.ai/mcp';

async function resolveHiEnergySecrets(context = {}) {
  const baseSecrets = context.secrets || {};
  if (baseSecrets.HIENERGY_API_KEY) {
    return {
      HIENERGY_API_KEY: baseSecrets.HIENERGY_API_KEY,
      HIENERGY_MCP_URL: baseSecrets.HIENERGY_MCP_URL || DEFAULT_MCP_URL
    };
  }

  const portalId =
    context.accountId ||
    context.portalId ||
    context.origin?.portalId ||
    context.parameters?.portalId;

  if (!portalId) {
    return baseSecrets;
  }

  const lookupUrl = baseSecrets.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL;
  const lookupToken = baseSecrets.HIENERGY_HUBSPOT_PORTAL_LOOKUP_TOKEN;
  if (lookupUrl) {
    const url = lookupUrl.replace(/\/$/, '') + '/' + encodeURIComponent(String(portalId));
    const headers = { Accept: 'application/json' };
    if (lookupToken) headers.Authorization = `Bearer ${lookupToken}`;

    const res = await fetch(url, { headers });
    if (res.ok) {
      const payload = await res.json();
      const apiKey = payload.api_key || payload.apiKey || payload.HIENERGY_API_KEY;
      if (apiKey) {
        return {
          HIENERGY_API_KEY: apiKey,
          HIENERGY_MCP_URL: payload.mcp_url || payload.mcpUrl || DEFAULT_MCP_URL
        };
      }
    }
  }

  const mapJson = baseSecrets.HIENERGY_HUBSPOT_PORTAL_KEYS;
  if (mapJson) {
    const map = JSON.parse(mapJson);
    const apiKey = map[String(portalId)];
    if (apiKey) {
      return {
        HIENERGY_API_KEY: apiKey,
        HIENERGY_MCP_URL: baseSecrets.HIENERGY_MCP_URL || DEFAULT_MCP_URL
      };
    }
  }

  return baseSecrets;
}

module.exports = {
  resolveHiEnergySecrets
};

const OAUTH_TOKEN_URL = 'https://api.hubapi.com/oauth/2026-03/token';

function getOAuthConfig() {
  return {
    clientId: process.env.HUBSPOT_CLIENT_ID || '',
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || process.env.HIENERGY_HUBSPOT_CLIENT_SECRET || '',
    redirectUri:
      process.env.HUBSPOT_REDIRECT_URI || 'https://app.hienergy.ai/hubspot/oauth/callback'
  };
}

function parseQuery(url) {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return new URLSearchParams();

  return new URLSearchParams(url.slice(queryIndex + 1));
}

function connectedAppsUrl() {
  return process.env.HIENERGY_HUBSPOT_CONNECTED_APPS_URL || 'https://app.hubspot.com/connected-apps';
}

async function exchangeAuthorizationCode(code) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  if (!clientId || !clientSecret) {
    throw new Error('Set HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET for OAuth callback.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code
  });

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload.message || payload.error_description || payload.error || res.statusText;
    throw new Error(`OAuth token exchange failed (${res.status}): ${message}`);
  }

  return payload;
}

async function handleOAuthCallback(req) {
  const params = parseQuery(req.url || '');
  const error = params.get('error');
  if (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: `<!DOCTYPE html><html><body><h1>HubSpot install failed</h1><p>${error}</p><p><a href="${connectedAppsUrl()}">Return to Connected apps</a></p></body></html>`
    };
  }

  const code = params.get('code');
  if (!code) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: `<!DOCTYPE html><html><body><h1>Missing authorization code</h1><p><a href="${connectedAppsUrl()}">Return to Connected apps</a></p></body></html>`
    };
  }

  await exchangeAuthorizationCode(code);

  return {
    statusCode: 302,
    headers: {
      Location: connectedAppsUrl(),
      'Cache-Control': 'no-store'
    },
    body: ''
  };
}

module.exports = {
  OAUTH_TOKEN_URL,
  handleOAuthCallback,
  exchangeAuthorizationCode,
  getOAuthConfig
};

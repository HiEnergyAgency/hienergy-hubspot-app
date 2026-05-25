const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { handleOAuthCallback, getOAuthConfig } = require('../breeze/oauth-callback');

describe('oauth callback', () => {
  const envBackup = {};

  beforeEach(() => {
    envBackup.HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
    envBackup.HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
    envBackup.HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI;
    process.env.HUBSPOT_CLIENT_ID = 'test-client-id';
    process.env.HUBSPOT_CLIENT_SECRET = 'test-client-secret';
    process.env.HUBSPOT_REDIRECT_URI = 'https://app.hienergy.ai/hubspot/oauth/callback';
  });

  afterEach(() => {
    process.env.HUBSPOT_CLIENT_ID = envBackup.HUBSPOT_CLIENT_ID;
    process.env.HUBSPOT_CLIENT_SECRET = envBackup.HUBSPOT_CLIENT_SECRET;
    process.env.HUBSPOT_REDIRECT_URI = envBackup.HUBSPOT_REDIRECT_URI;
  });

  it('reads OAuth config from environment', () => {
    assert.equal(getOAuthConfig().clientId, 'test-client-id');
    assert.equal(getOAuthConfig().redirectUri, 'https://app.hienergy.ai/hubspot/oauth/callback');
  });

  it('returns an error page when HubSpot sends an OAuth error', async () => {
    const response = await handleOAuthCallback({
      url: '/hubspot/oauth/callback?error=access_denied'
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.body, /access_denied/);
  });
});

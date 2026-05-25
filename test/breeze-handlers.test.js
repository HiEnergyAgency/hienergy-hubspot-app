const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const {
  readPortalId,
  dispatchHubSpotRequest,
  ROUTES
} = require('../breeze/handlers');

describe('breeze handlers', () => {
  const originalSecret = process.env.HUBSPOT_CLIENT_SECRET;

  beforeEach(() => {
    process.env.HUBSPOT_CLIENT_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env.HUBSPOT_CLIENT_SECRET = originalSecret;
  });

  it('registers card, settings, and breeze tool routes', () => {
    assert.ok(ROUTES['/hubspot/cards/universal-search']);
    assert.ok(ROUTES['/hubspot/cards/advertiser-by-domain']);
    assert.ok(ROUTES['/hubspot/cards/search-advertisers']);
    assert.ok(ROUTES['/hubspot/cards/search-contacts']);
    assert.ok(ROUTES['/hubspot/settings/validate']);
    assert.ok(ROUTES['/hubspot/settings']);
    assert.ok(ROUTES['/hubspot/breeze/tools/universal-search']);
  });

  it('reads portal id from card and agent payloads', () => {
    assert.equal(readPortalId({ portalId: 48470442 }), 48470442);
    assert.equal(readPortalId({ hubId: 123 }), 123);
    assert.equal(readPortalId({ origin: { portalId: 999 } }), 999);
    assert.equal(readPortalId({}), null);
  });

  it('returns 404 for unknown routes', async () => {
    const response = await dispatchHubSpotRequest({
      method: 'POST',
      url: '/hubspot/unknown',
      body: {},
      headers: {}
    });

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.error, 'NOT_FOUND');
  });

  it('rejects unsigned card requests', async () => {
    const response = await dispatchHubSpotRequest({
      method: 'POST',
      url: '/hubspot/cards/universal-search',
      body: { portalId: 123, query: 'nike' },
      headers: {},
      rawBody: '{"portalId":123,"query":"nike"}'
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.error, 'INVALID_SIGNATURE');
  });

  it('accepts signed card requests and resolves portal credentials', async () => {
    process.env.HIENERGY_HUBSPOT_PORTAL_KEYS = JSON.stringify({ 123: 'portal-key' });

    const method = 'POST';
    const requestUri = '/hubspot/settings/validate';
    const body = '{"portalId":123,"apiKey":"test-key"}';
    const signature = crypto
      .createHash('sha256')
      .update(`test-secret${method}${requestUri}${body}`, 'utf8')
      .digest('hex');

    const originalFetch = global.fetch;
    global.fetch = async (url) => {
      if (String(url).includes('/tools')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              tools: [],
              api_version: 'v1',
              base_url: 'https://app.hienergy.ai'
            })
        };
      }

      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({ result: { protocolVersion: '2025-11-25' } })
      };
    };

    try {
      const response = await dispatchHubSpotRequest({
        method,
        url: requestUri,
        body: { portalId: 123, apiKey: 'test-key' },
        headers: { 'x-hubspot-signature': signature },
        rawBody: body
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.ok, true);
    } finally {
      global.fetch = originalFetch;
      delete process.env.HIENERGY_HUBSPOT_PORTAL_KEYS;
    }
  });

  it('saves validated API keys for a portal', async () => {
    const tempDir = require('os').tmpdir();
    const storePath = require('path').join(tempDir, `portal-save-${Date.now()}.json`);
    process.env.HIENERGY_HUBSPOT_PORTAL_STORE = storePath;

    const method = 'POST';
    const requestUri = '/hubspot/settings';
    const body = '{"portalId":456,"apiKey":"save-key"}';
    const signature = crypto
      .createHash('sha256')
      .update(`test-secret${method}${requestUri}${body}`, 'utf8')
      .digest('hex');

    const originalFetch = global.fetch;
    global.fetch = async (url) => {
      if (String(url).includes('/tools')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              tools: [],
              api_version: 'v1',
              base_url: 'https://app.hienergy.ai'
            })
        };
      }

      return { ok: false, status: 404, text: async () => '{}' };
    };

    try {
      const response = await dispatchHubSpotRequest({
        method,
        url: requestUri,
        body: { portalId: 456, apiKey: 'save-key' },
        headers: { 'x-hubspot-signature': signature },
        rawBody: body
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.ok, true);

      const { loadPortalRecord } = require('../breeze/portal-storage');
      const saved = await loadPortalRecord(456);
      assert.equal(saved.apiKey, 'save-key');
    } finally {
      global.fetch = originalFetch;
      delete process.env.HIENERGY_HUBSPOT_PORTAL_STORE;
      await require('fs/promises').unlink(storePath).catch(() => {});
    }
  });
});

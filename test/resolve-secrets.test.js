const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveHiEnergySecrets } = require('../src/app/app.functions/lib/resolve-secrets');

describe('resolve-secrets', () => {
  it('prefers HIENERGY_API_KEY from app secrets', async () => {
    const secrets = await resolveHiEnergySecrets({
      secrets: { HIENERGY_API_KEY: 'test-key', HIENERGY_MCP_URL: 'https://example.com/mcp' },
      accountId: 123
    });

    assert.equal(secrets.HIENERGY_API_KEY, 'test-key');
    assert.equal(secrets.HIENERGY_MCP_URL, 'https://example.com/mcp');
  });

  it('reads portal keys from HIENERGY_HUBSPOT_PORTAL_KEYS map', async () => {
    const secrets = await resolveHiEnergySecrets({
      secrets: {
        HIENERGY_HUBSPOT_PORTAL_KEYS: JSON.stringify({ 456: 'portal-key' })
      },
      accountId: 456
    });

    assert.equal(secrets.HIENERGY_API_KEY, 'portal-key');
  });
});

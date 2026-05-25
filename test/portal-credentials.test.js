const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { resolveSecretsForPortal } = require('../breeze/portal-credentials');

describe('portal-credentials', () => {
  const envBackup = {};

  beforeEach(() => {
    envBackup.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL = process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL;
    envBackup.HIENERGY_HUBSPOT_PORTAL_LOOKUP_TOKEN = process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_TOKEN;
    envBackup.HIENERGY_HUBSPOT_PORTAL_KEYS = process.env.HIENERGY_HUBSPOT_PORTAL_KEYS;
    envBackup.HIENERGY_API_KEY = process.env.HIENERGY_API_KEY;
    envBackup.HIENERGY_MCP_URL = process.env.HIENERGY_MCP_URL;

    delete process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL;
    delete process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_TOKEN;
    delete process.env.HIENERGY_HUBSPOT_PORTAL_KEYS;
    delete process.env.HIENERGY_API_KEY;
    delete process.env.HIENERGY_MCP_URL;
  });

  afterEach(() => {
    Object.entries(envBackup).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  it('requires a portal id', async () => {
    await assert.rejects(
      () => resolveSecretsForPortal(null),
      /Missing HubSpot portal ID/
    );
  });

  it('reads API keys from the portal map', async () => {
    process.env.HIENERGY_HUBSPOT_PORTAL_KEYS = JSON.stringify({ 456: 'mapped-key' });

    const secrets = await resolveSecretsForPortal(456);
    assert.equal(secrets.HIENERGY_API_KEY, 'mapped-key');
    assert.equal(secrets.HIENERGY_MCP_URL, 'https://app.hienergy.ai/mcp');
  });

  it('falls back to HIENERGY_API_KEY for single-tenant dev', async () => {
    process.env.HIENERGY_API_KEY = 'dev-key';
    process.env.HIENERGY_MCP_URL = 'https://example.com/mcp';

    const secrets = await resolveSecretsForPortal('789');
    assert.equal(secrets.HIENERGY_API_KEY, 'dev-key');
    assert.equal(secrets.HIENERGY_MCP_URL, 'https://example.com/mcp');
  });

  it('throws when no credentials are configured', async () => {
    await assert.rejects(
      () => resolveSecretsForPortal(999),
      /No Hi Energy API key configured for HubSpot portal 999/
    );
  });
});

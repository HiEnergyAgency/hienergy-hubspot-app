const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { savePortalCredentials, loadPortalRecord } = require('../breeze/portal-storage');

describe('portal-storage', () => {
  let tempDir;
  let storePath;
  const envBackup = {};

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hienergy-portal-'));
    storePath = path.join(tempDir, 'portals.json');
    envBackup.HIENERGY_HUBSPOT_PORTAL_STORE = process.env.HIENERGY_HUBSPOT_PORTAL_STORE;
    envBackup.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL = process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL;
    envBackup.HIENERGY_HUBSPOT_PORTAL_KEYS = process.env.HIENERGY_HUBSPOT_PORTAL_KEYS;
    delete process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL;
    delete process.env.HIENERGY_HUBSPOT_PORTAL_KEYS;
    process.env.HIENERGY_HUBSPOT_PORTAL_STORE = storePath;
  });

  afterEach(async () => {
    process.env.HIENERGY_HUBSPOT_PORTAL_STORE = envBackup.HIENERGY_HUBSPOT_PORTAL_STORE;
    process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL = envBackup.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL;
    process.env.HIENERGY_HUBSPOT_PORTAL_KEYS = envBackup.HIENERGY_HUBSPOT_PORTAL_KEYS;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('persists portal credentials to the local store file', async () => {
    await savePortalCredentials(48470442, { apiKey: 'saved-key' });
    const record = await loadPortalRecord(48470442);

    assert.equal(record.apiKey, 'saved-key');
    assert.equal(record.apiBase, 'https://app.hienergy.ai/api/v1');
  });

  it('requires a portal id when saving', async () => {
    await assert.rejects(() => savePortalCredentials(null, { apiKey: 'x' }), /Missing HubSpot portal ID/);
  });
});

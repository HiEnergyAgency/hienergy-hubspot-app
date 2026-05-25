const fs = require('fs/promises');
const path = require('path');

const DEFAULT_API_BASE = 'https://app.hienergy.ai/api/v1';
const DEFAULT_MCP_URL = 'https://app.hienergy.ai/mcp';

function getStorePath() {
  return process.env.HIENERGY_HUBSPOT_PORTAL_STORE || '';
}

async function readStoreFile() {
  const storePath = getStorePath();
  if (!storePath) return {};

  try {
    const raw = await fs.readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    if (err && err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeStoreFile(map) {
  const storePath = getStorePath();
  if (!storePath) {
    throw new Error('Set HIENERGY_HUBSPOT_PORTAL_STORE to persist HubSpot portal API keys.');
  }

  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(map, null, 2) + '\n', 'utf8');
}

function normalizeRecord(record) {
  if (!record) return null;
  if (typeof record === 'string') {
    return { apiKey: record, apiBase: DEFAULT_API_BASE, mcpUrl: DEFAULT_MCP_URL };
  }

  const apiKey = record.api_key || record.apiKey || record.HIENERGY_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    apiBase: record.api_base || record.apiBase || DEFAULT_API_BASE,
    mcpUrl: record.mcp_url || record.mcpUrl || DEFAULT_MCP_URL
  };
}

async function loadPortalRecord(portalId) {
  const id = String(portalId);

  const mapJson = process.env.HIENERGY_HUBSPOT_PORTAL_KEYS;
  if (mapJson) {
    const map = JSON.parse(mapJson);
    const record = normalizeRecord(map[id]);
    if (record) return record;
  }

  const fileMap = await readStoreFile();
  return normalizeRecord(fileMap[id]);
}

async function savePortalCredentials(portalId, { apiKey, apiBase, mcpUrl } = {}) {
  const id = portalId == null ? '' : String(portalId);
  if (!id) {
    throw new Error('Missing HubSpot portal ID.');
  }

  const trimmedKey = String(apiKey || '').trim();
  if (!trimmedKey) {
    throw new Error('Missing Hi Energy API key.');
  }

  const record = {
    apiKey: trimmedKey,
    apiBase: apiBase || process.env.HIENERGY_API_BASE || DEFAULT_API_BASE,
    mcpUrl: mcpUrl || process.env.HIENERGY_MCP_URL || DEFAULT_MCP_URL
  };

  const lookupUrl = process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL;
  const lookupToken = process.env.HIENERGY_HUBSPOT_PORTAL_LOOKUP_TOKEN;
  if (lookupUrl) {
    const url = lookupUrl.replace(/\/$/, '') + '/' + encodeURIComponent(id);
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
    if (lookupToken) headers.Authorization = `Bearer ${lookupToken}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        portal_id: Number(id),
        api_key: record.apiKey,
        api_base: record.apiBase,
        mcp_url: record.mcpUrl
      })
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Portal storage failed (${res.status}): ${detail.slice(0, 200)}`);
    }

    return record;
  }

  const storePath = getStorePath();
  if (storePath) {
    const fileMap = await readStoreFile();
    fileMap[id] = record;
    await writeStoreFile(fileMap);
    return record;
  }

  throw new Error(
    'Configure HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL or HIENERGY_HUBSPOT_PORTAL_STORE for portal API key storage.'
  );
}

module.exports = {
  loadPortalRecord,
  savePortalCredentials,
  readStoreFile
};

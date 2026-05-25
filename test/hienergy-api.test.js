const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  extractListRows,
  normalizeUniversalSearchBody,
  DEFAULT_API_BASE
} = require('../src/app/app.functions/lib/hienergy-api');

describe('hienergy-api helpers', () => {
  it('uses the documented v1 API base URL', () => {
    assert.equal(DEFAULT_API_BASE, 'https://app.hienergy.ai/api/v1');
  });

  it('extracts list rows from REST envelopes', () => {
    assert.equal(
      extractListRows({
        data: [{ id: 1, attributes: { name: 'Nike' } }]
      }).length,
      1
    );
    assert.equal(
      extractListRows({
        contacts: { data: [{ id: 2, attributes: { email: 'a@nike.com' } }] }
      }).length,
      1
    );
  });

  it('normalizes universal search REST payloads', () => {
    const normalized = normalizeUniversalSearchBody({
      results: {
        advertisers: { total: 1, data: [{ id: 'a1' }] },
        contacts: { total: 1, data: [{ id: 'c1' }] }
      }
    });

    assert.equal(normalized.results.advertisers.total, 1);
    assert.equal(normalized.results.contacts.total, 1);
  });
});

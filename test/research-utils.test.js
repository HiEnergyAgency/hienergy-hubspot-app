const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

describe('research utils', () => {
  /** @type {typeof import('../src/app/cards/lib/researchUtils.js')} */
  let utils;

  before(async () => {
    utils = await import('../src/app/cards/lib/researchUtils.js');
  });

  it('extracts domain from website and email', () => {
    assert.equal(utils.domainFromWebsite('https://www.nike.com/store'), 'nike.com');
    assert.equal(utils.domainFromEmail('alex@nike.com'), 'nike.com');
  });

  it('builds company search context from CRM properties', () => {
    const byDomain = utils.getCompanySearchContext({
      domain: 'nike.com',
      name: 'Nike Inc'
    });
    assert.equal(byDomain.domain, 'nike.com');
    assert.equal(byDomain.query, 'nike.com');
    assert.match(byDomain.label, /Domain: nike\.com/);

    const byName = utils.getCompanySearchContext({ name: 'Acme Corp' });
    assert.equal(byName.query, 'Acme Corp');
    assert.match(byName.label, /Company: Acme Corp/);
  });

  it('builds contact search query from email or company', () => {
    assert.deepEqual(utils.getContactSearchQuery({ email: 'alex@nike.com' }), {
      domain: 'nike.com',
      query: 'alex@nike.com',
      email: 'alex@nike.com'
    });

    assert.deepEqual(utils.getContactSearchQueries({ email: 'alex@nike.com' }), {
      email: 'alex@nike.com',
      domain: 'nike.com',
      name: '',
      company: '',
      contactQuery: 'alex@nike.com',
      advertiserQuery: 'nike.com'
    });

    assert.deepEqual(
      utils.getContactSearchQuery({ firstname: 'Alex', lastname: 'Smith' }),
      {
        domain: '',
        query: 'Alex Smith',
        email: ''
      }
    );
  });

  it('normalizes advertiser-by-domain and universal search payloads', () => {
    const domainResult = utils.normalizeCompanyResearchBody({
      ok: true,
      domain: 'nike.com',
      advertisers: [{ id: '1', label: 'Nike' }]
    });
    assert.equal(domainResult.ok, true);
    assert.equal(domainResult.sections[0].type, 'advertisers');
    assert.equal(domainResult.sections[0].total, 1);

    const searchResult = utils.normalizeCompanyResearchBody({
      ok: true,
      query: 'nike',
      sections: [{ type: 'deals', total: 2, rows: [] }]
    });
    assert.equal(searchResult.sections[0].type, 'deals');

    const failure = utils.normalizeCompanyResearchBody({
      ok: false,
      message: 'Missing API key'
    });
    assert.equal(failure.ok, false);
    assert.match(failure.message, /Missing API key/);
  });

  it('summarizes research sections for sidebar alerts', () => {
    assert.equal(
      utils.researchSummary({
        sections: [
          { type: 'advertisers', total: 2, rows: [] },
          { type: 'deals', total: 1, rows: [] }
        ]
      }),
      '2 advertisers, 1 deals'
    );
    assert.equal(utils.researchSummary({ sections: [] }), 'No Hi Energy matches found.');
  });

  it('formats section titles for card UI', () => {
    assert.equal(
      utils.formatSectionTitle({ type: 'advertiser_contacts', total: 3 }),
      'Advertiser contacts · 3'
    );
  });

  it('merges advertiser and contact sections without duplicates', () => {
    const merged = utils.mergeResearchBodies([
      {
        ok: true,
        sections: [
          {
            type: 'advertisers',
            total: 1,
            rows: [{ id: 'a1', label: 'Nike' }]
          }
        ]
      },
      {
        ok: true,
        advertisers: [{ id: 'a1', label: 'Nike' }]
      },
      {
        ok: true,
        sections: [
          {
            type: 'contacts',
            total: 1,
            rows: [{ id: 'c1', label: 'Alex Smith' }]
          }
        ]
      }
    ]);

    assert.equal(merged.ok, true);
    assert.equal(merged.sections.length, 2);
    assert.equal(merged.sections[0].rows.length, 1);
    assert.equal(merged.sections[1].rows.length, 1);
  });
});

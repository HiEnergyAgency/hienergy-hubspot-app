const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  summarizeForCard,
  summarizeToolListResponse,
  domainFromEmail,
  domainFromWebsite,
  rowLabel,
  rowSubtitle
} = require('../src/app/app.functions/lib/hienergy-client');

describe('hienergy-client helpers', () => {
  it('extracts domain from email', () => {
    assert.equal(domainFromEmail('alex@nike.com'), 'nike.com');
  });

  it('extracts domain from website', () => {
    assert.equal(domainFromWebsite('https://www.nike.com/store'), 'nike.com');
  });

  it('summarizes universal search body into card sections', () => {
    const card = summarizeForCard(
      {
        results: {
          advertisers: {
            total: 2,
            data: [
              {
                id: 'a1',
                attributes: {
                  display_name: 'Nike',
                  slug: 'nike',
                  domain: 'nike.com',
                  program_status: 'active'
                }
              }
            ]
          },
          deals: {
            total: 1,
            data: [
              {
                id: 'd1',
                attributes: { title: 'Summer sale', advertiser_name: 'Nike', status: 'live' }
              }
            ]
          }
        }
      },
      5
    );

    assert.equal(card.sections.length, 2);
    assert.equal(card.sections[0].type, 'advertisers');
    assert.equal(card.sections[0].rows[0].label, 'Nike');
    assert.ok(card.sections[0].rows[0].adminUrl.includes('nike'));
  });

  it('formats row labels by type', () => {
    assert.equal(
      rowLabel('deals', { id: '1', attributes: { title: 'Promo' } }),
      'Promo'
    );
    assert.match(
      rowSubtitle('advertisers', {
        attributes: { domain: 'nike.com', program_status: 'active' }
      }),
      /active/
    );
  });

  it('summarizes advertiser and contact list responses for cards', () => {
    const advertisers = summarizeToolListResponse(
      'advertisers',
      {
        data: [{ id: 'a1', attributes: { display_name: 'Nike', slug: 'nike' } }]
      },
      5,
      'nike'
    );
    assert.equal(advertisers.sections[0].type, 'advertisers');
    assert.equal(advertisers.sections[0].rows[0].label, 'Nike');

    const contacts = summarizeToolListResponse(
      'contacts',
      {
        data: [
          {
            id: 'c1',
            attributes: {
              given_name: 'Alex',
              family_name: 'Smith',
              email: 'alex@nike.com'
            }
          }
        ]
      },
      5,
      'alex@nike.com'
    );
    assert.equal(contacts.sections[0].type, 'contacts');
    assert.equal(contacts.sections[0].rows[0].label, 'Alex Smith');
  });
});

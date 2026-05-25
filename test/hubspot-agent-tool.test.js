const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const {
  validateHubSpotSignatureV2,
  readAgentToolInputs,
  agentToolSuccess,
  agentToolFailure
} = require('../src/app/app.functions/lib/hubspot-agent-tool');

describe('hubspot-agent-tool helpers', () => {
  it('validates HubSpot v2 signatures', () => {
    const clientSecret = 'test-secret';
    const method = 'POST';
    const requestUri = '/hubspot/breeze/tools/universal-search';
    const body = '{"query":"nike"}';
    const signature = crypto
      .createHash('sha256')
      .update(`${clientSecret}${method}${requestUri}${body}`, 'utf8')
      .digest('hex');

    assert.equal(
      validateHubSpotSignatureV2({ clientSecret, method, requestUri, body, signature }),
      true
    );
  });

  it('reads agent tool input fields from HubSpot payload', () => {
    const parsed = readAgentToolInputs({
      callbackId: 'cb-1',
      origin: { portalId: 123, userId: 456 },
      context: { agentId: 789, source: 'AGENTS' },
      inputFields: { query: 'nike', types: 'advertisers' }
    });

    assert.equal(parsed.portalId, 123);
    assert.equal(parsed.fields.query, 'nike');
    assert.equal(parsed.fields.types, 'advertisers');
  });

  it('formats successful agent tool responses as string output fields', () => {
    const response = agentToolSuccess({ ok: true, sections: [] });
    assert.equal(response.outputFields.hs_execution_state, 'SUCCESS');
    assert.equal(response.outputFields.errorCode, '');
    assert.match(response.outputFields.result, /"ok":true/);
  });

  it('formats failed agent tool responses', () => {
    const response = agentToolFailure('Missing query', 'MISSING_QUERY');
    assert.equal(response.outputFields.hs_execution_state, 'FAIL_CONTINUE');
    assert.equal(response.outputFields.errorCode, 'MISSING_QUERY');
    assert.match(response.outputFields.result, /Missing query/);
  });
});

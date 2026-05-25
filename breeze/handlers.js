const {
  universalSearch,
  advertiserByDomain,
  searchAdvertisers,
  searchAdvertisersRaw,
  searchContacts,
  recommendReport,
  validateApiKey
} = require('../src/app/app.functions/lib/hienergy-client');
const {
  validateHubSpotRequest,
  readAgentToolInputs,
  agentToolSuccess,
  agentToolFailure
} = require('../src/app/app.functions/lib/hubspot-agent-tool');
const { resolveSecretsForPortal } = require('./portal-credentials');

const BREEZE_TOOL_BASE_URL = 'https://app.hienergy.ai/hubspot/breeze/tools';

function getHubSpotClientSecret() {
  const secret = process.env.HUBSPOT_CLIENT_SECRET || process.env.HIENERGY_HUBSPOT_CLIENT_SECRET;
  if (!secret) {
    throw new Error('Set HUBSPOT_CLIENT_SECRET for Breeze agent tool signature validation.');
  }
  return secret;
}

function readPortalId(body) {
  const payload = body && typeof body === 'object' ? body : {};
  return payload.portalId ?? payload.hubId ?? payload.origin?.portalId ?? null;
}

async function runSignedRequest(req, handler) {
  try {
    if (!validateHubSpotRequest(req, getHubSpotClientSecret())) {
      return { statusCode: 401, body: { ok: false, message: 'Invalid HubSpot signature.', error: 'INVALID_SIGNATURE' } };
    }

    const portalId = readPortalId(req.body);
    const secrets = await resolveSecretsForPortal(portalId);
    const result = await handler(req.body || {}, secrets);
    return { statusCode: result.ok === false ? 400 : 200, body: result };
  } catch (err) {
    return {
      statusCode: 500,
      body: { ok: false, message: String(err.message || err), error: 'SERVER_ERROR' }
    };
  }
}

async function runAgentTool(req, handler) {
  try {
    if (!validateHubSpotRequest(req, getHubSpotClientSecret())) {
      return { statusCode: 401, body: agentToolFailure('Invalid HubSpot signature.', 'INVALID_SIGNATURE') };
    }

    const { portalId, fields } = readAgentToolInputs(req.body);
    const secrets = await resolveSecretsForPortal(portalId);
    const result = await handler(fields, secrets);
    return {
      statusCode: 200,
      body: result.ok ? agentToolSuccess(result) : agentToolFailure(result.message, result.error)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: agentToolFailure(String(err.message || err), 'SERVER_ERROR')
    };
  }
}

async function handleUniversalSearch(req) {
  return runAgentTool(req, async (fields, secrets) => {
    const query = fields.query || fields.q;
    return universalSearch(query, secrets, {
      types: fields.types || 'advertisers,deals,contacts',
      perTypeLimit: fields.per_type_limit || fields.perTypeLimit || 5
    });
  });
}

async function handleAdvertiserByDomain(req) {
  return runAgentTool(req, async (fields, secrets) => advertiserByDomain(fields.domain, secrets));
}

async function handleSearchAdvertisers(req) {
  return runAgentTool(req, async (fields, secrets) =>
    searchAdvertisersRaw(fields.query || fields.name || fields.q, secrets, {
      vertical: fields.vertical,
      network: fields.network,
      country: fields.country,
      limit: fields.limit
    })
  );
}

async function handleRecommendReport(req) {
  return runAgentTool(req, async (fields, secrets) =>
    recommendReport(fields.goal || fields.query, secrets, {
      period: fields.period
    })
  );
}

async function handleCardUniversalSearch(req) {
  return runSignedRequest(req, async (body, secrets) =>
    universalSearch(body.query || body.q, secrets, {
      types: body.types || 'advertisers,deals,contacts',
      perTypeLimit: body.perTypeLimit || body.per_type_limit || 5
    })
  );
}

async function handleCardAdvertiserByDomain(req) {
  return runSignedRequest(req, async (body, secrets) => advertiserByDomain(body.domain, secrets));
}

async function handleCardSearchAdvertisers(req) {
  return runSignedRequest(req, async (body, secrets) =>
    searchAdvertisers(body.query || body.q || body.name, secrets, {
      vertical: body.vertical,
      network: body.network,
      country: body.country,
      limit: body.limit || body.perTypeLimit || body.per_type_limit || 10
    })
  );
}

async function handleCardSearchContacts(req) {
  return runSignedRequest(req, async (body, secrets) =>
    searchContacts(body.query || body.q || body.email, secrets, {
      limit: body.limit || body.perTypeLimit || body.per_type_limit || 10
    })
  );
}

async function handleSettingsValidate(req) {
  return runSignedRequest(req, async (body, secrets) => validateApiKey(body.apiKey, secrets));
}

const ROUTES = {
  '/hubspot/breeze/tools/universal-search': handleUniversalSearch,
  '/hubspot/breeze/tools/advertiser-by-domain': handleAdvertiserByDomain,
  '/hubspot/breeze/tools/search-advertisers': handleSearchAdvertisers,
  '/hubspot/breeze/tools/recommend-report': handleRecommendReport,
  '/hubspot/cards/universal-search': handleCardUniversalSearch,
  '/hubspot/cards/advertiser-by-domain': handleCardAdvertiserByDomain,
  '/hubspot/cards/search-advertisers': handleCardSearchAdvertisers,
  '/hubspot/cards/search-contacts': handleCardSearchContacts,
  '/hubspot/settings/validate': handleSettingsValidate
};

async function dispatchHubSpotRequest(req) {
  const path = (req.path || req.url || '').split('?')[0];
  const handler = ROUTES[path];
  if (!handler) {
    return {
      statusCode: 404,
      body: { ok: false, message: `Unknown HubSpot route: ${path}`, error: 'NOT_FOUND' }
    };
  }
  return handler(req);
}

async function dispatchBreezeAgentTool(req) {
  return dispatchHubSpotRequest(req);
}

module.exports = {
  BREEZE_TOOL_BASE_URL,
  dispatchBreezeAgentTool,
  dispatchHubSpotRequest,
  readPortalId,
  handleUniversalSearch,
  handleAdvertiserByDomain,
  handleSearchAdvertisers,
  handleRecommendReport,
  handleCardUniversalSearch,
  handleCardAdvertiserByDomain,
  handleCardSearchAdvertisers,
  handleCardSearchContacts,
  handleSettingsValidate,
  ROUTES
};

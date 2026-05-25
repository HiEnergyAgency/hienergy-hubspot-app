const {
  universalSearch,
  advertiserByDomain,
  searchAdvertisers,
  recommendReport
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
    searchAdvertisers(fields.query || fields.name || fields.q, secrets, {
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

const ROUTES = {
  '/hubspot/breeze/tools/universal-search': handleUniversalSearch,
  '/hubspot/breeze/tools/advertiser-by-domain': handleAdvertiserByDomain,
  '/hubspot/breeze/tools/search-advertisers': handleSearchAdvertisers,
  '/hubspot/breeze/tools/recommend-report': handleRecommendReport
};

async function dispatchBreezeAgentTool(req) {
  const path = (req.path || req.url || '').split('?')[0];
  const handler = ROUTES[path];
  if (!handler) {
    return {
      statusCode: 404,
      body: agentToolFailure(`Unknown Breeze tool route: ${path}`, 'NOT_FOUND')
    };
  }
  return handler(req);
}

module.exports = {
  BREEZE_TOOL_BASE_URL,
  dispatchBreezeAgentTool,
  handleUniversalSearch,
  handleAdvertiserByDomain,
  handleSearchAdvertisers,
  handleRecommendReport,
  ROUTES
};

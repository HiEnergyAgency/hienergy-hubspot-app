const { validateApiKey } = require('./lib/hienergy-client');
const { resolveHiEnergySecrets } = require('./lib/resolve-secrets');

exports.main = async (context = {}) => {
  const { apiKey } = context.parameters || {};
  const secrets = await resolveHiEnergySecrets(context);

  try {
    const result = await validateApiKey(apiKey, secrets);
    return { statusCode: result.ok ? 200 : 400, body: result };
  } catch (err) {
    return {
      statusCode: 500,
      body: { ok: false, error: 'SERVER_ERROR', message: String(err.message || err) }
    };
  }
};

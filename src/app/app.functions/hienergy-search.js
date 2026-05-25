const { universalSearch } = require('./lib/hienergy-client');
const { resolveHiEnergySecrets } = require('./lib/resolve-secrets');

exports.main = async (context = {}) => {
  const { query, types, perTypeLimit } = context.parameters || {};

  try {
    const secrets = await resolveHiEnergySecrets(context);
    const result = await universalSearch(query, secrets, {
      types: types || 'advertisers,deals,contacts',
      perTypeLimit: perTypeLimit ? Number(perTypeLimit) : 5
    });
    return { statusCode: result.ok ? 200 : 400, body: result };
  } catch (err) {
    return {
      statusCode: 500,
      body: { ok: false, error: 'SERVER_ERROR', message: String(err.message || err) }
    };
  }
};

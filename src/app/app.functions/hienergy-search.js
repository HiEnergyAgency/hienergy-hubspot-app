const { universalSearch } = require('./lib/hienergy-client');

exports.main = async (context = {}) => {
  const { query, types, perTypeLimit } = context.parameters || {};
  const secrets = context.secrets || {};

  try {
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

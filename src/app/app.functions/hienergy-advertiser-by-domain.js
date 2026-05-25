const { advertiserByDomain } = require('./lib/hienergy-client');

exports.main = async (context = {}) => {
  const { domain } = context.parameters || {};
  const secrets = context.secrets || {};

  try {
    const result = await advertiserByDomain(domain, secrets);
    return { statusCode: result.ok ? 200 : 400, body: result };
  } catch (err) {
    return {
      statusCode: 500,
      body: { ok: false, error: 'SERVER_ERROR', message: String(err.message || err) }
    };
  }
};

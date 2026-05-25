const crypto = require('crypto');

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function validateHubSpotSignatureV2({ clientSecret, method, requestUri, body, signature }) {
  if (!clientSecret || !signature) return false;
  const source = `${clientSecret}${method}${requestUri}${body}`;
  const hash = crypto.createHash('sha256').update(source, 'utf8').digest('hex');
  return timingSafeEqual(hash, signature);
}

function validateHubSpotSignatureV3({ clientSecret, method, requestUri, body, signature, timestamp }) {
  if (!clientSecret || !signature || !timestamp) return false;
  const source = `${method}${requestUri}${body}${timestamp}`;
  const hash = crypto.createHmac('sha256', clientSecret).update(source, 'utf8').digest('base64');
  return timingSafeEqual(hash, signature);
}

function validateHubSpotRequest(req, clientSecret) {
  const method = String(req.method || 'POST').toUpperCase();
  const requestUri = req.originalUrl || req.url || '';
  const body = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body || {});

  const v3Signature = req.headers['x-hubspot-signature-v3'];
  const v3Timestamp = req.headers['x-hubspot-request-timestamp'];
  if (v3Signature && validateHubSpotSignatureV3({
    clientSecret,
    method,
    requestUri,
    body,
    signature: v3Signature,
    timestamp: v3Timestamp
  })) {
    return true;
  }

  const v2Signature = req.headers['x-hubspot-signature'];
  if (v2Signature && validateHubSpotSignatureV2({
    clientSecret,
    method,
    requestUri,
    body,
    signature: v2Signature
  })) {
    return true;
  }

  return false;
}

function readAgentToolInputs(body) {
  const payload = body && typeof body === 'object' ? body : {};
  const fields = payload.inputFields || payload.fields || {};
  return {
    callbackId: payload.callbackId || null,
    portalId: payload.origin?.portalId ?? null,
    userId: payload.origin?.userId ?? null,
    agentId: payload.context?.agentId ?? null,
    fields
  };
}

function agentToolResponse(outputFields, executionState) {
  const response = { outputFields: stringifyOutputFields(outputFields) };
  if (executionState) {
    response.outputFields.hs_execution_state = executionState;
  }
  return response;
}

function agentToolSuccess(data, extraFields) {
  return agentToolResponse(
    {
      result: JSON.stringify(data),
      errorCode: '',
      ...(extraFields || {})
    },
    'SUCCESS'
  );
}

function agentToolFailure(message, errorCode, extraFields) {
  return agentToolResponse(
    {
      result: JSON.stringify({ ok: false, message }),
      errorCode: errorCode || 'AGENT_TOOL_ERROR',
      ...(extraFields || {})
    },
    'FAIL_CONTINUE'
  );
}

function stringifyOutputFields(fields) {
  const out = {};
  Object.keys(fields || {}).forEach((key) => {
    const value = fields[key];
    out[key] = value == null ? '' : String(value);
  });
  return out;
}

module.exports = {
  validateHubSpotRequest,
  readAgentToolInputs,
  agentToolResponse,
  agentToolSuccess,
  agentToolFailure,
  validateHubSpotSignatureV2,
  validateHubSpotSignatureV3
};

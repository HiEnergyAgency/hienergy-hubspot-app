const { createServer } = require('http');
const { dispatchHubSpotRequest } = require('./handlers');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8');
      req.rawBody = rawBody;
      if (!rawBody) {
        req.body = {};
        resolve();
        return;
      }
      try {
        req.body = JSON.parse(rawBody);
      } catch (err) {
        reject(err);
        return;
      }
      resolve();
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    await readJsonBody(req);
    const { statusCode, body } = await dispatchHubSpotRequest(req);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err.message || err) }));
  }
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8787);
  createServer(handleRequest).listen(port, () => {
    console.log(`Hi Energy Breeze agent tool webhook listening on :${port}`);
  });
}

module.exports = {
  handleRequest,
  readJsonBody
};

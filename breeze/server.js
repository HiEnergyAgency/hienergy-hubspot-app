const { createServer } = require('http');
const { readFile } = require('fs/promises');
const path = require('path');
const { dispatchHubSpotRequest } = require('./handlers');
const { handleOAuthCallback } = require('./oauth-callback');

const STATIC_ROUTES = {
  '/integrations/hubspot': 'integrations/hubspot/index.html',
  '/integrations/hubspot/': 'integrations/hubspot/index.html'
};

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

async function serveStatic(relativePath) {
  const filePath = path.join(__dirname, 'static', relativePath);
  const body = await readFile(filePath, 'utf8');
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    },
    body
  };
}

async function handleGetRequest(req, res) {
  const urlPath = (req.url || '/').split('?')[0];

  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'hienergy-hubspot-breeze' }));
    return;
  }

  if (urlPath === '/hubspot/oauth/callback') {
    try {
      const { statusCode, headers, body } = await handleOAuthCallback(req);
      res.writeHead(statusCode, headers);
      res.end(body);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>OAuth callback failed</h1><p>${String(err.message || err)}</p>`);
    }
    return;
  }

  const staticPath = STATIC_ROUTES[urlPath];
  if (staticPath) {
    try {
      const { statusCode, headers, body } = await serveStatic(staticPath);
      res.writeHead(statusCode, headers);
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'NOT_FOUND' }));
}

async function handlePostRequest(req, res) {
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

async function handleRequest(req, res) {
  if (req.method === 'GET') {
    await handleGetRequest(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handlePostRequest(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8787);
  createServer(handleRequest).listen(port, () => {
    console.log(`Hi Energy HubSpot webhook listening on :${port}`);
  });
}

module.exports = {
  handleRequest,
  readJsonBody,
  serveStatic,
  STATIC_ROUTES
};

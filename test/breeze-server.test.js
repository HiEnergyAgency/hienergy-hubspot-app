const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('events');
const { handleRequest } = require('../breeze/server');

function invokeHandleRequest(method, url, body) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;

    const res = {
      statusCode: 200,
      headers: null,
      body: '',
      writeHead(code, headers) {
        this.statusCode = code;
        this.headers = headers;
      },
      end(payload) {
        this.body = payload;
        resolve(this);
      }
    };

    handleRequest(req, res).catch(reject);

    const rawBody = body ? JSON.stringify(body) : '';
    if (rawBody) req.emit('data', Buffer.from(rawBody));
    req.emit('end');
  });
}

describe('breeze server', () => {
  it('rejects non-POST requests', async () => {
    const res = await invokeHandleRequest('GET', '/hubspot/cards/universal-search');
    assert.equal(res.statusCode, 405);
    assert.match(res.body, /Method not allowed/);
  });

  it('returns structured JSON errors for invalid payloads', async () => {
    const req = new EventEmitter();
    req.method = 'POST';
    req.url = '/hubspot/cards/universal-search';

    const res = await new Promise((resolve, reject) => {
      const response = {
        statusCode: 200,
        body: '',
        writeHead(code) {
          this.statusCode = code;
        },
        end(payload) {
          this.body = payload;
          resolve(this);
        }
      };

      handleRequest(req, response).catch(reject);
      req.emit('data', Buffer.from('{invalid-json'));
      req.emit('end');
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.body, /Unexpected token|JSON/i);
  });
});

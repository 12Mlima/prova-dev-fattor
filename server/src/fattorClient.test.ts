import assert from 'node:assert/strict';
import { test } from 'node:test';

import axios from 'axios';

import { getStatus } from './fattorClient';

interface MockResponse {
  status: number;
  body: unknown;
}

interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
}

const mockAxiosSequence = (t: import('node:test').TestContext, responses: MockResponse[]) => {
  const calls: RecordedCall[] = [];

  const handleRequest = async (config: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
  }) => {
    calls.push({ url: config.url, method: config.method ?? 'get', headers: config.headers ?? {} });

    const next = responses.shift();
    if (!next) {
      throw new Error('No more mocked responses configured.');
    }

    if (next.status >= 400) {
      const error = Object.assign(new Error(`Request failed with status code ${next.status}`), {
        isAxiosError: true,
        response: { status: next.status, data: next.body },
      });
      throw error;
    }

    return { status: next.status, data: next.body };
  };

  t.mock.method(axios.Axios.prototype, 'request', handleRequest);

  return calls;
};

test('logs in and returns the status for a valid access key', async (t) => {
  const calls = mockAxiosSequence(t, [
    { status: 200, body: { token: 'token-1', expires_in: -1, type: 'Bearer' } },
    { status: 200, body: { situacao: 'autorizada', chave_nfe: '123' } },
  ]);

  const result = await getStatus('123');

  assert.equal(result.situacao, 'autorizada');
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/login$/);
  assert.match(calls[1].url, /\/status\/123$/);
});

test('sends the token as a Bearer Authorization header', async (t) => {
  const calls = mockAxiosSequence(t, [
    { status: 200, body: { token: 'my-secret-token', expires_in: -1 } },
    { status: 200, body: { situacao: 'cancelada' } },
  ]);

  await getStatus('456');

  assert.equal(calls[1].headers.Authorization, 'Bearer my-secret-token');
});

test('retries login once when the status call returns 401', async (t) => {
  const calls = mockAxiosSequence(t, [
    { status: 200, body: { token: 'expired-token', expires_in: -1 } },
    { status: 401, body: { error: 'jwt expired' } },
    { status: 200, body: { token: 'fresh-token', expires_in: -1 } },
    { status: 200, body: { situacao: 'autorizada' } },
  ]);

  const result = await getStatus('789');

  assert.equal(result.situacao, 'autorizada');
  assert.equal(calls.length, 4);
  assert.equal(calls[3].headers.Authorization, 'Bearer fresh-token');
});

test('throws a clear error when login fails', async (t) => {
  mockAxiosSequence(t, [{ status: 400, body: { error: 'credenciais inválidas' } }]);

  await assert.rejects(() => getStatus('999'), /Falha no login.*credenciais inválidas/);
});

test('throws a clear error when the status call fails', async (t) => {
  mockAxiosSequence(t, [
    { status: 200, body: { token: 'token-x', expires_in: -1 } },
    { status: 500, body: { error: 'erro interno' } },
  ]);

  await assert.rejects(() => getStatus('111'), /Falha ao consultar status.*erro interno/);
});

test('caches the token and does not log in again before it expires', async (t) => {
  const calls = mockAxiosSequence(t, [
    { status: 200, body: { token: 'cached-token', expires_in: 300 } },
    { status: 200, body: { situacao: 'autorizada' } },
    { status: 200, body: { situacao: 'rejeitada' } },
  ]);

  const first = await getStatus('aaa');
  const second = await getStatus('bbb');

  assert.equal(first.situacao, 'autorizada');
  assert.equal(second.situacao, 'rejeitada');

  const loginCalls = calls.filter((call) => call.url.endsWith('/login'));
  assert.equal(loginCalls.length, 1);
});

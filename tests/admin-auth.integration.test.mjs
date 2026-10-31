import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = process.env.NERAMP_TEST_BASE_URL?.replace(/\/$/, '');
const suite = baseUrl ? describe : describe.skip;

async function request(path, options = {}) {
  return fetch(new URL(path, baseUrl), options);
}

async function login(email, password) {
  const response = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, 'test account must be able to sign in');
  assert.ok(body.token, 'login must return a bearer token');
  return body;
}

suite('NERAMP administrative API authorization', () => {
  test('rejects anonymous evidence uploads before processing file content', async () => {
    const response = await request('/api/v1/evidence/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filename: 'probe.jpg', fileContentBase64: 'not-a-real-upload' }),
    });
    assert.equal(response.status, 401);
  });

  test('rejects anonymous observer incident submissions', async () => {
    const response = await request('/api/v1/observer/incidents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'Security integration test; must not be created.' }),
    });
    assert.equal(response.status, 401);
  });

  test('protects observer assignments and submissions from anonymous access', async () => {
    for (const path of ['/api/v1/observer/assignments', '/api/v1/observer/submissions']) {
      const response = await request(path);
      assert.equal(response.status, 401, `${path} must require authentication`);
    }
  });

  test('protects generic evidence file and download endpoints', async () => {
    for (const path of [
      '/api/v1/evidence/file/evidence/nonexistent.jpg',
      '/api/v1/evidence/download/evidence/nonexistent.jpg',
    ]) {
      const response = await request(path);
      assert.equal(response.status, 401, `${path} must require authentication`);
    }
  });

  test('does not expose a non-existent or unapproved incident through the public evidence route', async () => {
    const response = await request('/api/v1/observer/incidents/security-test-nonexistent/evidence');
    assert.equal(response.status, 404);
  });

  test('rejects admin read without a bearer token even if identity headers are forged', async () => {
    const response = await request('/api/v1/admin/ingestion/status', {
      headers: {
        'x-actor-role': 'SUPER_ADMIN',
        'x-actor-email': 'drisatech@gmail.com',
      },
    });
    assert.equal(response.status, 401);
  });

  test('rejects admin write without a bearer token', async () => {
    const response = await request('/api/v1/admin/ingestion/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-actor-role': 'SUPER_ADMIN' },
      body: JSON.stringify({ electionId: 'test-only' }),
    });
    assert.equal(response.status, 401);
  });

  test('rejects unknown bearer tokens', async () => {
    const response = await request('/api/v1/admin/ingestion/status', {
      headers: { authorization: 'Bearer definitely-not-a-valid-token' },
    });
    assert.equal(response.status, 401);
  });

  test('requires password for login and does not permit passwordless setup', async () => {
    const email = process.env.NERAMP_TEST_ADMIN_EMAIL;
    if (!email) return;
    const response = await request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    assert.equal(response.status, 400);
  });

  test('rejects the retired shared default administrator password', async (t) => {
    const email = process.env.NERAMP_TEST_ADMIN_EMAIL;
    if (!email) {
      t.skip('Set NERAMP_TEST_ADMIN_EMAIL to a dedicated staging test administrator');
      return;
    }
    const response = await request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'Admin@Neramp2026!' }),
    });
    assert.notEqual(response.status, 200);
  });

  test('denies sensitive administrative writes to a limited-role account', async (t) => {
    const email = process.env.NERAMP_TEST_LIMITED_EMAIL;
    const password = process.env.NERAMP_TEST_LIMITED_PASSWORD;
    if (!email || !password) {
      t.skip('Set NERAMP_TEST_LIMITED_EMAIL/PASSWORD to a test RESULT_VERIFIER account');
      return;
    }
    const session = await login(email, password);
    const response = await request('/api/v1/admin/data/restore', {
      method: 'POST',
      headers: { authorization: `Bearer ${session.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ snapshot: {} }),
    });
    assert.equal(response.status, 403);
  });

  test('revokes a bearer token after logout', async (t) => {
    const email = process.env.NERAMP_TEST_ADMIN_EMAIL;
    const password = process.env.NERAMP_TEST_ADMIN_PASSWORD;
    if (!email || !password) {
      t.skip('Set NERAMP_TEST_ADMIN_EMAIL/PASSWORD to a dedicated test admin account');
      return;
    }
    const session = await login(email, password);
    const logout = await request('/api/v1/auth/logout', {
      method: 'POST',
      headers: { authorization: `Bearer ${session.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, userEmail: session.user.email }),
    });
    assert.equal(logout.status, 200);
    const afterLogout = await request('/api/v1/admin/ingestion/status', {
      headers: { authorization: `Bearer ${session.token}` },
    });
    assert.equal(afterLogout.status, 401);
  });
});

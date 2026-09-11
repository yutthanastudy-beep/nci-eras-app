/**
 * Cloudflare Pages Function - Login API
 */

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const jsonHeaders = {
    'Content-Type': 'application/json;charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: jsonHeaders });
  }

  if (method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  try {
    const data = await request.json();
    const { username, password } = data;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), { status: 400, headers: jsonHeaders });
    }

    // Hash the password with SHA-256 (same as schema.sql logic)
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check user in DB
    const user = await env.DB.prepare('SELECT id, role FROM users WHERE username = ? AND password_hash = ?')
      .bind(username, password_hash)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401, headers: jsonHeaders });
    }

    // Generate Session Token
    const tokenBuffer = new Uint8Array(32);
    crypto.getRandomValues(tokenBuffer);
    const tokenArray = Array.from(tokenBuffer);
    const token = tokenArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const now = new Date().toISOString();

    // Save session
    await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
      .bind(token, user.id, expiresAt, now)
      .run();

    // Set HttpOnly Cookie
    const headers = new Headers(jsonHeaders);
    headers.set('Set-Cookie', `session_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`); // Note: omitted Secure for easier local testing, but recommend adding it for production. Cloudflare Pages uses HTTPS anyway.

    return new Response(JSON.stringify({ success: true, role: user.role }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: jsonHeaders });
  }
}

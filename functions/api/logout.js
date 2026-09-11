/**
 * Cloudflare Pages Function - Logout API
 */

export async function onRequest(context) {
  const { env } = context;

  // Get session token from cookie
  const cookieHeader = context.request.headers.get('Cookie') || '';
  let token = null;
  for (const cookie of cookieHeader.split(';').map(c => c.trim())) {
    if (cookie.startsWith('session_token=')) {
      token = cookie.substring('session_token='.length);
      break;
    }
  }

  // Delete session from DB
  if (token) {
    try {
      await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    } catch (e) {
      // ignore
    }
  }

  // Clear the cookie
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
    }
  });
}

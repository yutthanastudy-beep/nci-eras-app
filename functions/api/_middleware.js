/**
 * API Middleware - Authentication Guard
 */

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Allow OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return next();
  }

  // Allow unrestricted access to the login endpoint
  if (url.pathname === '/api/login') {
    return next();
  }

  const jsonHeaders = {
    'Content-Type': 'application/json;charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Extract session token from cookie
  const cookieHeader = request.headers.get('Cookie');
  let token = null;

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('session_token=')) {
        token = cookie.substring('session_token='.length);
        break;
      }
    }
  }

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized: No session token provided' }), { status: 401, headers: jsonHeaders });
  }

  try {
    // Validate session in DB
    const now = new Date().toISOString();
    
    // Check if token exists and hasn't expired
    const session = await env.DB.prepare(
      'SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?'
    ).bind(token, now).first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired session' }), { status: 401, headers: jsonHeaders });
    }

    // Attach user_id to context for downstream functions if needed
    context.data = { user_id: session.user_id };

    // Continue to the requested API endpoint
    return next();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: jsonHeaders });
  }
}

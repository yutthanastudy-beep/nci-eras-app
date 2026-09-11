import { onRequest as loginHandler } from '../functions/api/login.js';
import { onRequest as patientsHandler } from '../functions/api/patients.js';
import { onRequest as middleware } from '../functions/api/_middleware.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route API requests manually (since we are on Workers, not Pages)
    if (url.pathname.startsWith('/api/')) {
      
      // 1. Run Middleware
      let authResponse = await middleware({ request, env, next: () => null });
      if (authResponse) return authResponse;

      // 2. Route to specific endpoints
      if (url.pathname === '/api/login') {
        return await loginHandler({ request, env });
      }
      if (url.pathname === '/api/patients') {
        return await patientsHandler({ request, env });
      }
      
      return new Response(JSON.stringify({ error: 'Not Found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Serve static frontend assets for everything else
    return env.ASSETS.fetch(request);
  }
};

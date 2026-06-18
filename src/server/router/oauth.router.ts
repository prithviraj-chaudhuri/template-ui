import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';

interface OAuthState {
  csrf: string;
  serverName: string;
  timestamp: number;
}

// In-memory storage for CSRF tokens (consider Redis for production)
const csrfTokens = new Map<string, OAuthState>();

// Clean up old tokens (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  for (const [token, state] of csrfTokens.entries()) {
    if (now - state.timestamp > TEN_MINUTES) {
      csrfTokens.delete(token);
    }
  }
}, 60 * 1000); // Run every minute

const oauthRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /oauth/prepare - Store CSRF token before redirecting to OAuth provider
   */
  fastify.post<{
    Body: {
      csrf: string;
      serverName: string;
    };
  }>('/oauth/prepare', async (request, reply) => {
    const { csrf, serverName } = request.body;

    if (!csrf || !serverName) {
      return reply.status(400).send({
        error: 'Missing csrf or serverName',
      });
    }

    csrfTokens.set(csrf, {
      csrf,
      serverName,
      timestamp: Date.now(),
    });

    return reply.send({ success: true });
  });

  /**
   * GET /oauth/callback - Handle OAuth callback from provider
   */
  fastify.get<{
    Querystring: {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };
  }>('/oauth/callback', async (request, reply) => {
    const { code, state, error, error_description } = request.query;

    // Handle OAuth error
    if (error) {
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: #1a1a1a;
                color: #fff;
              }
              .container {
                text-align: center;
                padding: 2rem;
                max-width: 500px;
              }
              .error {
                color: #ef4444;
                font-size: 1.5rem;
                margin-bottom: 1rem;
              }
              .message {
                color: #a3a3a3;
                margin-bottom: 2rem;
              }
              button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 1rem;
              }
              button:hover {
                background: #2563eb;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">Authentication Failed</div>
              <div class="message">${error_description || error}</div>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }

    // Verify CSRF token
    if (!state || !csrfTokens.has(state)) {
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: #1a1a1a;
                color: #fff;
              }
              .container {
                text-align: center;
                padding: 2rem;
                max-width: 500px;
              }
              .error {
                color: #ef4444;
                font-size: 1.5rem;
                margin-bottom: 1rem;
              }
              .message {
                color: #a3a3a3;
                margin-bottom: 2rem;
              }
              button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 1rem;
              }
              button:hover {
                background: #2563eb;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">Invalid OAuth State</div>
              <div class="message">CSRF token validation failed. Please try again.</div>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }

    const oauthState = csrfTokens.get(state);
    csrfTokens.delete(state); // One-time use

    // Success - close window and notify parent
    return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #1a1a1a;
              color: #fff;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 500px;
            }
            .success {
              color: #22c55e;
              font-size: 1.5rem;
              margin-bottom: 1rem;
            }
            .message {
              color: #a3a3a3;
              margin-bottom: 2rem;
            }
            .spinner {
              border: 4px solid #404040;
              border-top: 4px solid #22c55e;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✓ Authentication Successful</div>
            <div class="message">Server "${oauthState?.serverName}" has been connected.</div>
            <div class="spinner"></div>
          </div>
          <script>
            // Notify parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth-success',
                serverName: '${oauthState?.serverName}',
                code: '${code}'
              }, window.location.origin);
            }
            // Close window after 2 seconds
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  });
};

export default oauthRoutes;

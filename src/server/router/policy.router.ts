import { FastifyInstance, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { getSettings } from '../utils/settings.js';
import authCheckPlugin from '../plugins/auth-check.plugin.js';

function getAgentHost(): string {
  const cfg = getSettings();
  return cfg.agent.endpoint || process.env.AGENT_HOST || process.env.AGENT_URL || 'http://localhost:5002';
}

interface TokenPair {
  accessToken: string | null;
  refreshToken: string | null;
  refreshFailed?: boolean;
}

async function ensureFreshTokens(
  fastify: FastifyInstance,
  request: { session?: { token?: { access_token?: string; refresh_token?: string; expires_at?: number } } },
): Promise<TokenPair> {
  const session = request.session;
  const token = session?.token;
  if (!token?.access_token) return { accessToken: null, refreshToken: null };

  const expiresAt = token.expires_at ? new Date(token.expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 30_000) {
    return { accessToken: token.access_token, refreshToken: token.refresh_token ?? null };
  }

  try {
    const sso = (fastify as { redhatSSO?: { getNewAccessTokenUsingRefreshToken: (t: unknown, o: object) => Promise<{ token: { access_token: string; refresh_token?: string } }> } }).redhatSSO;
    if (!sso) return { accessToken: token.access_token, refreshToken: token.refresh_token ?? null };

    const refreshed = await sso.getNewAccessTokenUsingRefreshToken(token, {});
    session!.token = refreshed.token;
    fastify.log.info('Access token refreshed before policy API call');
    return {
      accessToken: refreshed.token.access_token,
      refreshToken: refreshed.token.refresh_token ?? null,
    };
  } catch (err) {
    fastify.log.error({ err }, 'Token refresh failed');
    return { accessToken: null, refreshToken: null, refreshFailed: true };
  }
}

function sessionExpiredReply(reply: FastifyReply) {
  return reply.status(401).send({
    error: 'session_expired',
    message: 'Token refresh failed. Please log in again.',
  });
}

function buildAgentHeaders(accessToken: string | null, refreshToken: string | null, traceId: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Trace-ID': traceId,
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
    headers['X-Token'] = accessToken;
  }
  if (refreshToken) {
    headers['X-Refresh-Token'] = refreshToken;
  }
  return headers;
}

async function proxyAgentRequest(
  fastify: FastifyInstance,
  request: { session?: object },
  reply: FastifyReply,
  method: string,
  path: string,
  body?: unknown,
) {
  const traceId = randomUUID();
  const { accessToken, refreshToken, refreshFailed } = await ensureFreshTokens(fastify, request);

  if (refreshFailed) {
    return sessionExpiredReply(reply);
  }

  if (!accessToken && process.env.AUTH_ENABLED === 'true') {
    return reply.status(401).send({ error: 'Not authenticated' });
  }

  const headers = buildAgentHeaders(accessToken, refreshToken, traceId);
  const agentUrl = `${getAgentHost()}${path}`;

  try {
    const fetchOptions: RequestInit = { method, headers };
    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(agentUrl, fetchOptions);
    reply.header('X-Trace-ID', traceId);
    reply.status(response.status);

    const contentType = response.headers.get('content-type');
    if (contentType) {
      reply.header('Content-Type', contentType);
    }

    const responseBody = await response.text();
    return reply.send(responseBody);
  } catch (error) {
    fastify.log.error({ traceId, error }, 'Policy proxy error');
    return reply.status(502).send({ error: 'Failed to connect to agent service' });
  }
}

async function policyRoutes(fastify: FastifyInstance) {
  await fastify.register(authCheckPlugin);

  fastify.get<{ Params: { userId: string } }>(
    '/policy/settings/:userId',
    async (request, reply) => {
      const { userId } = request.params;
      return proxyAgentRequest(
        fastify,
        request,
        reply,
        'GET',
        `/api/v1/policy/settings/${encodeURIComponent(userId)}`,
      );
    },
  );

  fastify.put<{ Params: { userId: string }; Body: { settings: Record<string, unknown> } }>(
    '/policy/settings/:userId',
    async (request, reply) => {
      const { userId } = request.params;
      return proxyAgentRequest(
        fastify,
        request,
        reply,
        'PUT',
        `/api/v1/policy/settings/${encodeURIComponent(userId)}`,
        request.body,
      );
    },
  );

  fastify.delete<{ Params: { userId: string } }>(
    '/policy/settings/:userId',
    async (request, reply) => {
      const { userId } = request.params;
      return proxyAgentRequest(
        fastify,
        request,
        reply,
        'DELETE',
        `/api/v1/policy/settings/${encodeURIComponent(userId)}`,
      );
    },
  );

  fastify.get('/policy/defaults', async (request, reply) => {
    return proxyAgentRequest(fastify, request, reply, 'GET', '/api/v1/policy/defaults');
  });

  fastify.get<{ Params: { templateId: string } }>(
    '/policy/schema/:templateId',
    async (request, reply) => {
      const { templateId } = request.params;
      return proxyAgentRequest(
        fastify,
        request,
        reply,
        'GET',
        `/api/v1/policy/schema/${encodeURIComponent(templateId)}`,
      );
    },
  );

  fastify.post<{ Params: { templateId: string }; Body: { settings: Record<string, unknown> } }>(
    '/policy/validate/:templateId',
    async (request, reply) => {
      const { templateId } = request.params;
      return proxyAgentRequest(
        fastify,
        request,
        reply,
        'POST',
        `/api/v1/policy/validate/${encodeURIComponent(templateId)}`,
        request.body,
      );
    },
  );
}

export { policyRoutes };

/**
 * Signing in with COROS. COROS's self-service access is its MCP server with
 * OAuth 2.0: the app registers itself (dynamic client registration), so there
 * is no client secret and no server step; PKCE protects the code exchange.
 * Every endpoint answers the browser directly (CORS), so all of this runs here.
 *
 * Tokens and the registered client stay in this browser's localStorage; Forma never sends them anywhere but COROS.
 */
const DISCOVERY = 'https://mcp.coros.com/.well-known/oauth-protected-resource/mcp';
const SCOPE = 'openid mcp.tools offline_access';
export const COROS_CALLBACK_PATH = '/coros/callback';

const KEY_CLIENT = 'forma.coros.client';
const KEY_TOKENS = 'forma.coros.tokens';
const KEY_PENDING = 'forma.coros.pending';

interface ServerInfo {
  /** The MCP endpoint for the athlete's region, e.g. https://mcpeu.coros.com/mcp */
  resource: string;
  authorize: string;
  token: string;
  register: string;
}

export interface CorosTokens {
  accessToken: string;
  refreshToken?: string;
  /** Milliseconds since the epoch. */
  expiresAt: number;
  resource: string;
}

const redirectUri = () => `${window.location.origin}${COROS_CALLBACK_PATH}`;

const read = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

async function discover(): Promise<ServerInfo> {
  const resource = (await (await fetch(DISCOVERY)).json()) as { resource: string; authorization_servers: string[] };
  const issuer = resource.authorization_servers[0]!;
  const meta = (await (await fetch(`${issuer}/.well-known/oauth-authorization-server`)).json()) as {
    authorization_endpoint: string;
    token_endpoint: string;
    registration_endpoint: string;
  };
  return {
    resource: resource.resource,
    authorize: meta.authorization_endpoint,
    token: meta.token_endpoint,
    register: meta.registration_endpoint,
  };
}

/** One registration per browser and redirect address, reused afterwards. */
async function clientId(server: ServerInfo): Promise<string> {
  const saved = read<{ id: string; redirect: string; register: string }>(KEY_CLIENT);
  if (saved && saved.redirect === redirectUri() && saved.register === server.register) return saved.id;
  const res = await fetch(server.register, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Forma (local)',
      redirect_uris: [redirectUri()],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: SCOPE,
    }),
  });
  if (!res.ok) throw new Error(`COROS registration failed (${res.status}): ${await res.text()}`);
  const { client_id } = (await res.json()) as { client_id: string };
  write(KEY_CLIENT, { id: client_id, redirect: redirectUri(), register: server.register });
  return client_id;
}

const base64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export async function startCorosSignIn() {
  const server = await discover();
  const id = await clientId(server);
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const state = crypto.randomUUID();
  sessionStorage.setItem(KEY_PENDING, JSON.stringify({ verifier, state, server, id }));
  const url = new URL(server.authorize);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: id,
    redirect_uri: redirectUri(),
    scope: SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    resource: server.resource,
  }).toString();
  window.location.assign(url.toString());
}

async function tokenRequest(server: { token: string; resource: string }, body: Record<string, string>) {
  const res = await fetch(server.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...body, resource: server.resource }).toString(),
  });
  if (!res.ok) throw new Error(`COROS token request failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  const tokens: CorosTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    resource: server.resource,
  };
  write(KEY_TOKENS, { ...tokens, tokenUrl: server.token });
  return tokens;
}

/** Handles COROS's redirect back (`location.search`). */
export async function finishCorosSignIn(search: string): Promise<CorosTokens> {
  const params = new URLSearchParams(search);
  const pending = JSON.parse(sessionStorage.getItem(KEY_PENDING) ?? 'null') as {
    verifier: string;
    state: string;
    server: ServerInfo;
    id: string;
  } | null;
  sessionStorage.removeItem(KEY_PENDING);
  if (params.get('error')) throw new Error(`COROS said: ${params.get('error_description') ?? params.get('error')}`);
  const code = params.get('code');
  if (!pending || !code || params.get('state') !== pending.state) throw new Error('Sign-in could not be checked. Try again.');
  return tokenRequest(pending.server, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    client_id: pending.id,
    code_verifier: pending.verifier,
  });
}

/** Saved tokens, refreshed a minute before they run out; null when not signed in. */
export async function corosTokens(): Promise<CorosTokens | null> {
  const saved = read<CorosTokens & { tokenUrl: string }>(KEY_TOKENS);
  if (!saved) return null;
  if (saved.expiresAt - 60_000 > Date.now() || !saved.refreshToken) return saved;
  const client = read<{ id: string }>(KEY_CLIENT);
  if (!client) return null;
  return tokenRequest(
    { token: saved.tokenUrl, resource: saved.resource },
    { grant_type: 'refresh_token', refresh_token: saved.refreshToken, client_id: client.id },
  );
}

export function forgetCoros() {
  localStorage.removeItem(KEY_TOKENS);
}

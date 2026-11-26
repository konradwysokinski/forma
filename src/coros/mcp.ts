/**
 * A minimal MCP client over Streamable HTTP for COROS's stateless server:
 * one JSON-RPC request per POST; the reply is JSON or a short event stream.
 */
import type { CorosTokens } from './oauth';

let nextId = 1;

export interface ToolResult {
  content?: { type: string; text?: string }[];
  structuredContent?: unknown;
  isError?: boolean;
}

async function rpc<T>(tokens: CorosTokens, method: string, params?: unknown): Promise<T> {
  const res = await fetch(tokens.resource, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-06-18',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, ...(params !== undefined && { params }) }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`COROS MCP ${method} failed (${res.status}): ${text.slice(0, 500)}`);
  // An event stream carries the reply in "data:" lines.
  const body = res.headers.get('content-type')?.includes('text/event-stream')
    ? text
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .pop() ?? ''
    : text;
  const message = JSON.parse(body) as { result?: T; error?: { message: string } };
  if (message.error) throw new Error(`COROS MCP ${method}: ${message.error.message}`);
  return message.result as T;
}

export async function initialize(tokens: CorosTokens) {
  return rpc<{ serverInfo?: { name: string; version: string }; protocolVersion?: string }>(tokens, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'forma', version: '0.1.0' },
  });
}

export async function listTools(tokens: CorosTokens) {
  return rpc<{ tools: { name: string; description?: string }[] }>(tokens, 'tools/list', {});
}

export async function callTool(tokens: CorosTokens, name: string, args: Record<string, unknown> = {}) {
  return rpc<ToolResult>(tokens, 'tools/call', { name, arguments: args });
}

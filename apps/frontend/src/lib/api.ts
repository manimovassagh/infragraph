import type { CloudProvider, ParseResponse, ApiError, SessionSummary, Session, CreateSessionRequest } from '@infragraph/shared';
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Returns auth headers if logged in, empty object otherwise. */
async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function parseFile(file: File, provider?: CloudProvider): Promise<ParseResponse> {
  const form = new FormData();
  form.append('tfstate', file);

  const params = provider ? `?provider=${provider}` : '';
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/parse${params}`, { method: 'POST', body: form, headers });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.details ?? err.error);
  }

  return res.json();
}

export async function parseHcl(files: File[], provider?: CloudProvider): Promise<ParseResponse> {
  const form = new FormData();
  for (const file of files) {
    form.append('files', file);
  }

  const params = provider ? `?provider=${provider}` : '';
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/parse/hcl${params}`, { method: 'POST', body: form, headers });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.details ?? err.error);
  }

  return res.json();
}

export async function parseRaw(tfstate: string, provider?: CloudProvider): Promise<ParseResponse> {
  const params = provider ? `?provider=${provider}` : '';
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(`${API_BASE}/api/parse/raw${params}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tfstate }),
  });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.details ?? err.error);
  }

  return res.json();
}

// ─── Session API ─────────────────────────────────────────────────────────────

export async function listSessions(): Promise<SessionSummary[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/sessions`, { headers });
  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.details ?? err.error);
  }
  return res.json();
}

export async function getSession(id: string): Promise<Session> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/sessions/${id}`, { headers });
  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.details ?? err.error);
  }
  return res.json();
}

export async function saveSession(payload: CreateSessionRequest): Promise<SessionSummary> {
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.details ?? err.error);
  }
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/sessions/${id}`, { method: 'DELETE', headers });
  if (!res.ok && res.status !== 204) {
    const err: ApiError = await res.json();
    throw new Error(err.details ?? err.error);
  }
}

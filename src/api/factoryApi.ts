import axios from 'axios';

const BASE = 'https://api.factory.ai/api/v0';

function client(apiKey: string) {
  return axios.create({
    baseURL: BASE,
    headers: {Authorization: `Bearer ${apiKey}`},
  });
}

export interface Session {
  sessionId: string;
  title?: string;
  status: 'idle' | 'pending' | 'running';
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  computerId?: string;
}

export interface ContentBlock {
  id?: string;
  type:
    | 'text'
    | 'image'
    | 'thinking'
    | 'redacted_thinking'
    | 'tool_use'
    | 'tool_result'
    | 'document';
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  toolUseId?: string;
  thinking?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: ContentBlock[];
  createdAt: number;
  updatedAt: number;
  isUserVisible?: boolean;
}

export interface PaginatedSessions {
  sessions: Session[];
  pagination: {hasMore: boolean; nextCursor: string | null};
}

export interface PaginatedMessages {
  messages: Message[];
  pagination: {hasMore: boolean; nextCursor: string | null};
}

export async function listSessions(
  apiKey: string,
  cursor?: string,
): Promise<PaginatedSessions> {
  const params: Record<string, string> = {limit: '20'};
  if (cursor) {
    params.cursor = cursor;
  }
  const res = await client(apiKey).get('/sessions', {params});
  return res.data;
}

export async function getSession(
  apiKey: string,
  sessionId: string,
): Promise<Session> {
  const res = await client(apiKey).get(`/sessions/${sessionId}`);
  return res.data;
}

export async function getMessages(
  apiKey: string,
  sessionId: string,
  cursor?: string,
): Promise<PaginatedMessages> {
  const params: Record<string, string> = {limit: '50'};
  if (cursor) {
    params.cursor = cursor;
  }
  const res = await client(apiKey).get(`/sessions/${sessionId}/messages`, {
    params,
  });
  return res.data;
}

export async function postMessage(
  apiKey: string,
  sessionId: string,
  text: string,
): Promise<{messageId: string; status: string}> {
  const res = await client(apiKey).post(`/sessions/${sessionId}/messages`, {
    text,
  });
  return res.data;
}

export async function interruptSession(
  apiKey: string,
  sessionId: string,
): Promise<void> {
  await client(apiKey).post(`/sessions/${sessionId}/interrupt`);
}

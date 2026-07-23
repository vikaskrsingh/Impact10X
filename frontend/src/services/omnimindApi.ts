export interface User {
  id: number;
  username: string;
  role: string;
  allowed_agents: string[];
}

export interface AgentRecord {
  id: string;
  name: string;
  owner: string;
  documents: number;
  questions: number;
  health: number;
  status: string;
  users?: number;
}

export interface DocumentRecord {
  id: string;
  name: string;
  owner: string;
  status: string;
  version: string;
  agentId: string;
}

export interface ChatResponse {
  id: number;
  answer: string;
  sources: string[];
  expert: string;
  confidenceScore: number;
}

export interface ChatHistoryMessage {
  id: number;
  user_message: string;
  assistant_message: string;
  timestamp: string;
}

import { getStoredToken } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(init?.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function login(username: string, password: string): Promise<{ access_token: string; token_type: string; role: string }> {
  return api<{ access_token: string; token_type: string; role: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function getAgents(): Promise<AgentRecord[]> {
  return api<AgentRecord[]>("/agents");
}

export async function createAgent(name: string, owner: string): Promise<AgentRecord> {
  return api<AgentRecord>("/agents", {
    method: "POST",
    body: JSON.stringify({ name, owner }),
  });
}

export async function deleteAgent(agentId: string): Promise<{ deleted: boolean; agentId: string }> {
  return api<{ deleted: boolean; agentId: string }>(`/agents/${agentId}`, { method: "DELETE" });
}

export async function getUsers(): Promise<User[]> {
  return api<User[]>("/users");
}

export async function updateUserAccess(username: string, agentIds: string[]): Promise<void> {
  await api(`/users/${username}/agents`, {
    method: "PUT",
    body: JSON.stringify({ agent_ids: agentIds }),
  });
}

export async function getDocuments(agentId?: string): Promise<DocumentRecord[]> {
  const query = agentId ? `?agent_id=${encodeURIComponent(agentId)}` : "";
  return api<DocumentRecord[]>(`/documents${query}`);
}

export async function uploadDocument(name: string, owner: string, agentId: string): Promise<DocumentRecord> {
  return api<DocumentRecord>("/documents", {
    method: "POST",
    body: JSON.stringify({ name, owner, agentId }),
  });
}

export async function uploadDocumentFile(file: File, owner: string, agentId: string): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("owner", owner);
  formData.append("agentId", agentId);

  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Upload failed");
  }

  return response.json() as Promise<DocumentRecord>;
}

export async function uploadDocumentUrl(url: string, owner: string, agentId: string): Promise<DocumentRecord> {
  return api<DocumentRecord>("/documents/url", {
    method: "POST",
    body: JSON.stringify({ url, owner, agentId }),
  });
}

export async function deleteDocument(docId: string): Promise<{ status: string }> {
  return api<{ status: string }>(`/documents/${docId}`, {
    method: "DELETE",
  });
}

export async function askExpert(
  expertId: string,
  question: string,
  useInternetSearch: boolean = false,
  sessionId?: string
): Promise<ChatResponse> {
  return api<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ expertId, question, useInternetSearch, sessionId }),
  });
}

export async function askMultipleExperts(
  expertIds: string[],
  question: string,
  useInternetSearch: boolean = false,
  sessionId?: string
): Promise<ChatResponse> {
  return api<ChatResponse>("/chat/multi", {
    method: "POST",
    body: JSON.stringify({ expertIds, question, useInternetSearch, sessionId }),
  });
}

export async function streamExpert(
  expertId: string, 
  question: string,
  useInternetSearch: boolean,
  sessionId: string | undefined,
  onMetadata: (metadata: { sources: string[], confidenceScore: number, expert: string }) => void,
  onChunk: (text: string) => void,
  onDone: (id: number) => void
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expertId, question, useInternetSearch, sessionId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Request failed");
  }

  if (!response.body) throw new Error("ReadableStream not supported");
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
      
      if (chunk.startsWith('data: ')) {
        try {
          const data = JSON.parse(chunk.slice(6));
          if (data.type === 'metadata') {
            onMetadata({ sources: data.sources, confidenceScore: data.confidenceScore, expert: data.expert });
          } else if (data.type === 'chunk') {
            onChunk(data.text);
          } else if (data.type === 'done') {
            onDone(data.id);
          }
        } catch (e) {
          console.error("Error parsing SSE chunk", e);
        }
      }
    }
  }
}

export async function streamMultipleExperts(
  expertIds: string[], 
  question: string,
  useInternetSearch: boolean,
  sessionId: string | undefined,
  onMetadata: (metadata: { sources: string[], confidenceScore: number, expert: string }) => void,
  onChunk: (text: string) => void,
  onDone: (id: number) => void
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/multi/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expertIds, question, useInternetSearch, sessionId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Request failed");
  }

  if (!response.body) throw new Error("ReadableStream not supported");
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
      
      if (chunk.startsWith('data: ')) {
        try {
          const data = JSON.parse(chunk.slice(6));
          if (data.type === 'metadata') {
            onMetadata({ sources: data.sources, confidenceScore: data.confidenceScore, expert: data.expert });
          } else if (data.type === 'chunk') {
            onChunk(data.text);
          } else if (data.type === 'done') {
            onDone(data.id);
          }
        } catch (e) {
          console.error("Error parsing SSE chunk", e);
        }
      }
    }
  }
}

export async function submitChatFeedback(messageId: number, isHelpful: boolean): Promise<{ success: boolean }> {
  return api<{ success: boolean }>(`/chat/${messageId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ isHelpful }),
  });
}

export async function getChatHistory(expertId: string, sessionId: string): Promise<ChatHistoryMessage[]> {
  return api<ChatHistoryMessage[]>(`/chat/history/${expertId}?session_id=${encodeURIComponent(sessionId)}`);
}

export async function clearChatHistory(expertId: string, sessionId: string): Promise<{ status: string }> {
  return api<{ status: string }>(`/chat/history/${expertId}?session_id=${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

export interface DashboardStats {
  totalExperts: number;
  averageHealth: number;
  totalDocuments: number;
  totalQuestions: number;
}

export interface DashboardActivity {
  title: string;
  detail: string;
  time: string;
}

export interface DashboardUpload {
  name: string;
  owner: string;
  status: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return api<DashboardStats>("/dashboard/stats");
}

export async function getRecentActivity(): Promise<DashboardActivity[]> {
  return api<DashboardActivity[]>("/dashboard/recent-activity");
}

export async function getRecentUploads(): Promise<DashboardUpload[]> {
  return api<DashboardUpload[]>("/dashboard/recent-uploads");
}

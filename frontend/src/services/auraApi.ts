export interface AgentRecord {
  id: string;
  name: string;
  owner: string;
  documents: number;
  questions: number;
  health: number;
  status: string;
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Request failed");
  }

  return response.json() as Promise<T>;
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

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
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

export async function askExpert(expertId: string, question: string): Promise<ChatResponse> {
  return api<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ expertId, question }),
  });
}

export async function submitChatFeedback(messageId: number, isHelpful: boolean): Promise<{ status: string }> {
  return api<{ status: string }>(`/chat/${messageId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ isHelpful }),
  });
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

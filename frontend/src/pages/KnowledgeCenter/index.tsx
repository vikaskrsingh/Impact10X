import { FileUp, FileText, ShieldCheck, Tag, Link as LinkIcon, Activity, ShieldAlert, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PanelCard } from "../../components/common/PanelCard";
import { getStoredRole, isAdminRole } from "@/utils/auth";
import { getDocuments, uploadDocumentFile, uploadDocumentUrl, getAgents, deleteDocument } from "../../services/auraApi";

type DocumentItem = {
  id: string;
  name: string;
  owner: string;
  status: string;
  version: string;
  agentId: string;
};

export default function KnowledgeCenter() {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [agents, setAgents] = useState<{id: string, label: string}[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(searchParams.get("expert") ?? "");
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  useEffect(() => {
    void loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const fetchedAgents = await getAgents();
      setAgents(fetchedAgents.map((a) => ({ id: a.id, label: a.name })));
      
      const currentSelection = searchParams.get("expert");
      if (!currentSelection && fetchedAgents.length > 0) {
        setSelectedAgentId(fetchedAgents[0].id);
      }
    } catch (error) {
      console.error("Unable to load agents", error);
    }
  };

  const loadDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const nextDocuments = await getDocuments(selectedAgentId);
      setDocuments(nextDocuments.map((document) => ({ ...document, version: document.version || "v1" })));
    } catch (error) {
      console.error("Unable to load documents", error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await deleteDocument(docId);
      void loadDocuments();
    } catch (error) {
      console.error("Failed to delete document", error);
    }
  };

  const getStatusStyles = (status: string) => {
    if (status === "Failed") return "border-red-500/30 bg-red-500/10 text-red-400";
    if (status === "Processing") return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  };

  const getStatusIcon = (status: string) => {
    if (status === "Failed") return <ShieldAlert className="mr-1 h-3.5 w-3.5" />;
    if (status === "Processing") return <Activity className="mr-1 h-3.5 w-3.5 animate-spin" />;
    return <ShieldCheck className="mr-1 h-3.5 w-3.5" />;
  };

  useEffect(() => {
    void loadDocuments();
  }, [selectedAgentId]);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const role = getStoredRole();
  const isAdmin = isAdminRole(role);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (uploadMode === "file" && !selectedFile) return;
    if (uploadMode === "url" && !urlInput.trim()) return;
    
    setIsUploading(true);
    try {
      let uploadedDocument;
      if (uploadMode === "file" && selectedFile) {
        uploadedDocument = await uploadDocumentFile(selectedFile, "Admin", selectedAgentId);
      } else if (uploadMode === "url" && urlInput.trim()) {
        uploadedDocument = await uploadDocumentUrl(urlInput.trim(), "Admin", selectedAgentId);
      }
      
      if (uploadedDocument) {
        setDocuments((current) => [{ ...uploadedDocument, version: uploadedDocument.version || "v1" }, ...current]);
      }
      
      setSelectedFile(null);
      setUrlInput("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Unable to upload document", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary glow-text">Knowledge Center</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Manage enterprise documents and approvals</h1>
      </div>

      <PanelCard title="Upload documents" subtitle="Only administrators can attach new documents to a specific expert knowledge set">
        {isAdmin ? (
          <div className="rounded-2xl border border-dashed border-primary/40 bg-black/40 p-8 text-center glass-panel">
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => setUploadMode("file")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${uploadMode === 'file' ? 'bg-primary/20 text-primary border border-primary/50' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FileUp size={16} /> File Upload
              </button>
              <button 
                onClick={() => setUploadMode("url")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${uploadMode === 'url' ? 'bg-primary/20 text-primary border border-primary/50' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <LinkIcon size={16} /> URL Link
              </button>
            </div>
            
            <p className="mt-2 text-sm text-slate-400">Documents are extracted, embedded, and indexed automatically for the chosen agent.</p>
            
            <div className="mt-4 flex flex-col items-center justify-center gap-3 md:flex-row max-w-2xl mx-auto">
              <select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)} className="rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-slate-200 focus:border-primary glow-border w-full md:w-auto">
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.label}
                  </option>
                ))}
              </select>
              
              {uploadMode === "file" ? (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-md border border-white/20 glass-panel/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:glass-panel/10 disabled:opacity-50 w-full md:w-auto whitespace-nowrap"
                  >
                    {selectedFile ? "Change file" : "Choose file"}
                  </button>
                </>
              ) : (
                <input
                  type="url"
                  placeholder="https://confluence.bank.internal/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="rounded-md border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-slate-200 focus:border-primary glow-border w-full flex-1"
                />
              )}
              
              <button
                onClick={() => void handleUpload()}
                disabled={isUploading || (uploadMode === "file" ? !selectedFile : !urlInput.trim())}
                className="rounded-md bg-primary/80 border border-primary px-6 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-primary glow-border disabled:opacity-50 w-full md:w-auto whitespace-nowrap"
              >
                {isUploading ? "Processing..." : "Add to agent"}
              </button>
            </div>
            {uploadMode === "file" && selectedFile && (
              <div className="mt-4 text-sm text-slate-400">
                Selected: <span className="font-medium text-slate-100 glow-text">{selectedFile.name}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 p-8 text-center text-sm text-slate-400 glass-panel">
            Only administrators can upload documents to the approved knowledge base for an agent.
          </div>
        )}
      </PanelCard>

      <PanelCard title="Document catalog" subtitle="Versioned and governed knowledge assets linked to the selected expert">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <span className="font-medium text-slate-300">Showing documents for:</span>
          <span className="rounded-full bg-primary/20 border border-primary/50 px-2.5 py-1 text-sm font-semibold text-primary glow-border">
            {agents.find((agent) => agent.id === selectedAgentId)?.label}
          </span>
        </div>
        <div className="space-y-3">
          {documents.map((document) => (
            <div key={document.id} className="flex flex-col gap-3 rounded-xl border border-white/10 glass-panel/5 p-4 md:flex-row md:items-center md:justify-between transition-colors hover:glass-panel/10">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 border border-primary/30 p-2 text-primary glow-border">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-100">{document.name}</p>
                  <p className="text-sm text-slate-400">Owner • {document.owner} • Version {document.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-medium text-slate-300">
                  <Tag className="mr-1 h-3.5 w-3.5" />
                  Policy
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyles(document.status)}`}>
                  {getStatusIcon(document.status)}
                  {document.status}
                </span>
                {isAdmin && (
                  <button onClick={() => void handleDeleteDocument(document.id)} className="ml-2 rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}
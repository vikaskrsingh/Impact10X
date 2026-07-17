import { FileUp, FileText, ShieldCheck, Tag } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { PanelCard } from "../../components/common/PanelCard";
import { getStoredRole, isAdminRole } from "@/utils/auth";
import { getDocuments, uploadDocumentFile } from "../../services/auraApi";

type DocumentItem = {
  id: string;
  name: string;
  owner: string;
  status: string;
  version: string;
  agentId: string;
};

const agents = [
  { id: "all", label: "All Documents" },
  { id: "gdpr", label: "GDPR & Privacy" },
  { id: "amld", label: "AMLD6" },
  { id: "mifid", label: "MiFID II" },
  { id: "psd2", label: "PSD2 Fraud" },
];

export default function KnowledgeCenter() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const role = getStoredRole();
  const isAdmin = isAdminRole(role);

  useEffect(() => {
    void loadDocuments();
  }, [selectedAgentId]);

  const loadDocuments = async () => {
    try {
      const nextDocuments = await getDocuments(selectedAgentId);
      setDocuments(nextDocuments.map((document) => ({ ...document, version: document.version || "v1" })));
    } catch (error) {
      console.error("Unable to load documents", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      const uploadedDocument = await uploadDocumentFile(selectedFile, "Admin", selectedAgentId);
      setDocuments((current) => [{ ...uploadedDocument, version: uploadedDocument.version || "v1" }, ...current]);
      setSelectedFile(null);
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
            <FileUp className="mx-auto h-10 w-10 text-primary glow-text" />
            <p className="mt-3 text-sm font-semibold text-slate-100">Upload files for the selected expert knowledge base</p>
            <p className="mt-2 text-sm text-slate-400">Documents are extracted, embedded, and indexed automatically for the chosen agent.</p>
            <div className="mt-4 flex flex-col items-center justify-center gap-3 md:flex-row">
              <select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)} className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-200 focus:border-primary glow-border">
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.label}
                  </option>
                ))}
              </select>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-md border border-white/20 glass-panel/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:glass-panel/10 disabled:opacity-50"
              >
                {selectedFile ? "Change file" : "Choose file"}
              </button>
              <button
                onClick={() => void handleUpload()}
                disabled={isUploading || !selectedFile}
                className="rounded-md bg-primary/80 border border-primary px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-primary glow-border disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Upload to agent"}
              </button>
            </div>
            {selectedFile && (
              <div className="mt-3 text-sm text-slate-400">
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
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  {document.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}
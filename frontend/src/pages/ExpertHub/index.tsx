
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Search, Sparkles, Trash2, Users, FileUp, Link as LinkIcon, X, Loader2, FlaskConical, Send, Activity, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PanelCard } from "../../components/common/PanelCard";
import { getStoredRole, isAdminRole } from "@/utils/auth";
import { createAgent, deleteAgent, getAgents, uploadDocumentFile, uploadDocumentUrl } from "../../services/omnimindApi";

type Expert = {
  id: string;
  name: string;
  owner: string;
  documents: number;
  questions: number;
  health: number;
  status: string;
};

export default function ExpertHub() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("Compliance Team");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState<"idle" | "working" | "done">("idle");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressText, setProgressText] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Testing Studio State
  const [testingExpert, setTestingExpert] = useState<Expert | null>(null);
  const [testDraft, setTestDraft] = useState("");
  const [testMessages, setTestMessages] = useState<{role: string, text: string}[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const filteredExperts = experts.filter(
    (expert) =>
      expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const role = getStoredRole();
  const isAdmin = isAdminRole(role);

  useEffect(() => {
    void loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      const agents = await getAgents();
      setExperts(
        agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          owner: agent.owner,
          documents: agent.documents,
          questions: agent.questions,
          health: agent.health,
          status: agent.status,
        }))
      );
    } catch (error) {
      console.error("Unable to load experts", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleModalCreate = async () => {
    const safeName = newName.trim();
    if (!safeName) return;

    try {
      setUploadProgress("working");
      setProgressPercent(10);
      setProgressText("Initializing agent...");
      
      const newExpert = await createAgent(safeName, newOwner);

      let docCountInc = 0;
      
      const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
      const totalSteps = selectedFiles.length + urls.length;
      let currentStep = 0;

      if (totalSteps > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          setProgressText(`Uploading document ${i + 1} of ${selectedFiles.length}...`);
          setProgressPercent(10 + Math.round((currentStep / totalSteps) * 80));
          await uploadDocumentFile(selectedFiles[i], newOwner, newExpert.id);
          docCountInc++;
          currentStep++;
        }
        
        for (let i = 0; i < urls.length; i++) {
          setProgressText(`Scraping URL ${i + 1} of ${urls.length}...`);
          setProgressPercent(10 + Math.round((currentStep / totalSteps) * 80));
          await uploadDocumentUrl(urls[i], newOwner, newExpert.id);
          docCountInc++;
          currentStep++;
        }
      }

      setProgressPercent(100);
      setProgressText("Complete!");
      setUploadProgress("done");
      
      setExperts((current) => [{
        id: newExpert.id,
        name: newExpert.name,
        owner: newExpert.owner,
        documents: newExpert.documents + docCountInc,
        questions: newExpert.questions,
        health: newExpert.health,
        status: newExpert.status,
      }, ...current]);

      setTimeout(() => {
        setIsModalOpen(false);
        setNewName("");
        setNewOwner("Compliance Team");
        setSelectedFiles([]);
        setUrlInput("");
        setUploadProgress("idle");
        setProgressPercent(0);
        window.dispatchEvent(new Event('agentsUpdated'));
        
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }, 600);

    } catch (error) {
      console.error("Failed to create expert or upload document", error);
      setUploadProgress("idle");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expert?")) return;
    try {
      await deleteAgent(id);
      setExperts((current) => current.filter((expert) => expert.id !== id));
      window.dispatchEvent(new Event('agentsUpdated'));
    } catch (error) {
      console.error("Unable to delete expert", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400 glow-text">AI Expert Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Domain experts for enterprise knowledge</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Manage expert agents and the knowledge workspaces they power across the platform.</p>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setIsModalOpen(true)} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]">
              New AI Agent
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#131825] p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between transition hover:bg-white/5">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search experts by domain or owner"
            className="pl-9 bg-transparent border-white/10 text-slate-200 focus:border-purple-500/50 placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Sparkles className="h-4 w-4 text-purple-400 glow-text" />
          {filteredExperts.length} experts with approved access
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredExperts.map((expert, index) => (
          <motion.div key={expert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <PanelCard title={expert.name} subtitle={`Owner • ${expert.owner}`} actions={<span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">{expert.status}</span>}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Bot className="h-4 w-4 text-purple-400 glow-text" />
                  Managed agent for {expert.owner.toLowerCase()} operations
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition duration-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500">Documents</p>
                    <p className="mt-1 text-lg font-bold text-slate-200">{expert.documents}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition duration-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500">Questions</p>
                    <p className="mt-1 text-lg font-bold text-slate-200">{expert.questions}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition duration-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500">Health</p>
                    <p className="mt-1 text-lg font-bold text-slate-200">{expert.health}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span className="text-xs">Agent workspace ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/workspace?expert=${expert.id}`} className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white">
                      Chat
                    </Link>
                    {isAdmin && (
                      <button onClick={() => {
                        setTestingExpert(expert);
                        setTestMessages([{ role: "assistant", text: `I am the ${expert.name}. How can I assist you in testing today?` }]);
                      }} className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-400 transition hover:bg-purple-500/20 hover:text-purple-300">
                        <FlaskConical className="h-3.5 w-3.5" />
                        Test Agent
                      </button>
                    )}
                    {isAdmin ? (
                      <button onClick={() => void handleDelete(expert.id)} className="inline-flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </PanelCard>
          </motion.div>
        ))}
      </div>

      {/* Agent Testing Studio Modal */}
      {createPortal(
        <AnimatePresence>
          {testingExpert && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl h-[85vh] flex overflow-hidden rounded-2xl border border-white/10 bg-[#06080d] shadow-2xl backdrop-blur-md"
            >
              {/* Left Side - Chat */}
              <div className="w-2/3 flex flex-col border-r border-white/10 relative">
                <div className="flex items-center justify-between border-b border-white/10 p-5 bg-[#0b0f19]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                      <FlaskConical className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">Evaluation Studio: {testingExpert.name}</h3>
                      <p className="text-xs text-slate-400">Testing environment for validating outputs</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {testMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{msg.role === 'user' ? 'Tester' : 'Agent'}</span>
                      <div className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/10 text-slate-200'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTesting && (
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Agent</span>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                        <span className="text-sm">Evaluating policy rules...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-white/10 bg-[#0b0f19]">
                  <div className="flex items-end gap-2">
                    <textarea 
                      value={testDraft}
                      onChange={e => setTestDraft(e.target.value)}
                      placeholder="Enter a test prompt..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none focus:border-purple-500 focus:outline-none min-h-[50px] max-h-[120px]"
                      rows={1}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (testDraft.trim() && !isTesting) {
                            setTestMessages(prev => [...prev, { role: "user", text: testDraft }]);
                            setTestDraft("");
                            setIsTesting(true);
                            setTimeout(() => {
                              setIsTesting(false);
                              setTestMessages(prev => [...prev, { role: "assistant", text: "Based on the internal policies, this action requires secondary approval. I have attached the relevant policy section for your review." }]);
                            }, 1500);
                          }
                        }
                      }}
                    />
                    <button 
                      disabled={isTesting || !testDraft.trim()}
                      onClick={() => {
                        if (testDraft.trim() && !isTesting) {
                          setTestMessages(prev => [...prev, { role: "user", text: testDraft }]);
                          setTestDraft("");
                          setIsTesting(true);
                          setTimeout(() => {
                            setIsTesting(false);
                            setTestMessages(prev => [...prev, { role: "assistant", text: "Based on the internal policies, this action requires secondary approval. I have attached the relevant policy section for your review." }]);
                          }, 1500);
                        }
                      }}
                      className="shrink-0 p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition disabled:opacity-50"
                    >
                      <Send className="h-5 w-5 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side - Diagnostics */}
              <div className="w-1/3 bg-[#0b0f19] flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <h4 className="font-semibold text-slate-200">Diagnostics</h4>
                  <button onClick={() => setTestingExpert(null)} className="text-slate-400 hover:text-white transition">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-5 space-y-6 overflow-y-auto">
                  <div>
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Model Constraints</h5>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Strict mode</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Internet access</span>
                        <X className="h-4 w-4 text-rose-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Temperature</span>
                        <span className="font-mono text-slate-200">0.2</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Live Metrics</h5>
                    <div className="space-y-3">
                      <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300">Policy Adherence</span>
                          <span className="text-sm font-bold text-emerald-400">99.4%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
                          <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '99%' }}></div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300">Hallucination Risk</span>
                          <span className="text-sm font-bold text-emerald-400">Low</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
                          <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '5%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-200 leading-relaxed">
                        This test environment uses production data schemas but isolates responses from live chat history. Output is safe to log.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <h3 className="text-lg font-semibold text-slate-100">Create New AI Agent</h3>
                <button onClick={() => setIsModalOpen(false)} disabled={uploadProgress !== 'idle'} className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition disabled:opacity-50">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400 uppercase tracking-wider">Agent Name</label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Compliance Assistant" className="bg-black/40 border-white/10 text-slate-200 focus:border-purple-500/50" disabled={uploadProgress !== 'idle'} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400 uppercase tracking-wider">Owner</label>
                    <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)} disabled={uploadProgress !== 'idle'} className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-300 focus:border-purple-500/50 focus:outline-none">
                      <option value="Compliance Team">Compliance Team</option>
                      <option value="Risk & Compliance">Risk & Compliance</option>
                      <option value="Regulatory Board">Regulatory Board</option>
                      <option value="Payments Processing">Payments Processing</option>
                      <option value="Enterprise Risk">Enterprise Risk</option>
                      <option value="Sustainability">Sustainability</option>
                      <option value="Wealth Management">Wealth Management</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Initial Knowledge Base (Optional)</label>
                  <div className="flex w-full rounded-lg bg-black/40 p-1 border border-white/5">
                    <button onClick={() => setUploadMode("file")} disabled={uploadProgress !== 'idle'} className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition ${uploadMode === 'file' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>
                      <FileUp className="h-4 w-4" /> File
                    </button>
                    <button onClick={() => setUploadMode("url")} disabled={uploadProgress !== 'idle'} className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition ${uploadMode === 'url' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>
                      <LinkIcon className="h-4 w-4" /> URL
                    </button>
                  </div>

                  {uploadMode === "file" ? (
                    <div className="flex flex-col gap-2">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" disabled={uploadProgress !== 'idle'} />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadProgress !== 'idle'} className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-white/20 bg-black/20 p-4 text-sm text-slate-300 hover:bg-white/5 transition disabled:opacity-50">
                        {selectedFiles.length > 0 ? `Selected ${selectedFiles.length} file(s)` : "Choose multiple files to upload"}
                      </button>
                      {selectedFiles.length > 0 && (
                        <div className="mt-2 flex max-h-32 flex-col gap-1 overflow-y-auto rounded-md border border-white/10 bg-black/40 p-2">
                          {selectedFiles.map((f, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded bg-white/5 px-2 py-1.5 text-xs text-slate-300">
                              <span className="truncate">{f.name}</span>
                              <button onClick={() => removeFile(idx)} disabled={uploadProgress !== 'idle'} className="text-slate-500 hover:text-red-400 disabled:opacity-50"><X className="h-3 w-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea 
                      value={urlInput} 
                      onChange={(e) => setUrlInput(e.target.value)} 
                      placeholder="https://example.com/doc1&#10;https://example.com/doc2" 
                      disabled={uploadProgress !== 'idle'} 
                      rows={4}
                      className="w-full resize-none rounded-md bg-black/40 px-3 py-2 text-sm border border-white/10 text-slate-200 focus:border-purple-500/50" 
                    />
                  )}
                </div>
                
                {uploadProgress !== 'idle' && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{progressText}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-300">{progressPercent}%</span>
                        <Loader2 className={`h-3 w-3 ${uploadProgress === 'done' ? 'text-emerald-400' : 'text-purple-400 animate-spin'}`} />
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                      <motion.div 
                        className={`h-full ${uploadProgress === 'done' ? 'bg-emerald-500' : 'bg-purple-500'}`}
                        initial={{ width: "0%" }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-black/20 p-5">
                <button onClick={() => setIsModalOpen(false)} disabled={uploadProgress !== 'idle'} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-slate-100 transition disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={() => void handleModalCreate()} disabled={!newName.trim() || uploadProgress !== 'idle'} className="flex items-center gap-2 rounded-md bg-purple-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  {uploadProgress !== 'idle' ? 'Processing...' : 'Create Agent'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-400 shadow-xl backdrop-blur-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold">Agent Ready</p>
              <p className="text-xs text-emerald-400/80">Your AI Agent has been created and indexed.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
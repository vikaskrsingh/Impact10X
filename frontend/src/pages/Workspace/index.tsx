import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Sparkles, FileText, Bot, MessageSquareText, Loader2, Info } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PanelCard } from "../../components/common/PanelCard";
import { askExpert, getAgents } from "../../services/auraApi";

type Message = {
  role: "assistant" | "user";
  text: string;
  sources?: string[];
};

type ExpertThread = {
  id: string;
  name: string;
  owner: string;
  description: string;
};

type ReferenceDocument = {
  name: string;
  confidence: string;
};

const expertsSeed: ExpertThread[] = [
  { id: "gdpr", name: "GDPR Expert", owner: "Data Protection", description: "Data privacy and client consent guidance" },
  { id: "amld", name: "AMLD6 Analyst", owner: "Risk", description: "EU anti-money laundering and sanctions screening" },
  { id: "mifid", name: "MiFID II Specialist", owner: "Compliance", description: "Investor protection and market transparency" },
  { id: "psd2", name: "PSD2 Fraud Expert", owner: "Fraud", description: "Strong Customer Authentication and payment security" },
];

const expertDocuments: Record<string, ReferenceDocument[]> = {
  gdpr: [
    { name: "GDPR Article 30 Records.pdf", confidence: "97%" },
    { name: "Client Consent Policy.pdf", confidence: "95%" },
  ],
  amld: [
    { name: "AMLD6 High-Risk Screening.pdf", confidence: "96%" },
    { name: "EU Sanctions SOP.pdf", confidence: "94%" },
  ],
  mifid: [
    { name: "MiFID II Suitability Guidelines.pdf", confidence: "95%" },
    { name: "Client Classification.docx", confidence: "93%" },
  ],
  psd2: [
    { name: "SCA Requirements.pdf", confidence: "97%" },
    { name: "PSD2 Incident Reporting.docx", confidence: "94%" },
  ],
};

const defaultThreads: Record<string, Message[]> = {
  gdpr: [
    { role: "assistant", text: "I can answer questions using the latest GDPR policy pack and cite the relevant Article 30 records.", sources: ["GDPR Article 30 Records.pdf", "Client Consent Policy.pdf"] },
  ],
  amld: [
    { role: "assistant", text: "I can summarize AMLD6 controls, EU sanctions policies, and reporting procedures for your review.", sources: ["AMLD6 High-Risk Screening.pdf", "EU Sanctions SOP.pdf"] },
  ],
  mifid: [
    { role: "assistant", text: "I can help explain MiFID II suitability decisions with the most relevant regulatory reference documents.", sources: ["MiFID II Suitability Guidelines.pdf", "Client Classification.docx"] },
  ],
  psd2: [
    { role: "assistant", text: "I can pull the latest PSD2 Strong Customer Authentication rules for the payment dispute at hand.", sources: ["SCA Requirements.pdf", "PSD2 Incident Reporting.docx"] },
  ],
};

const suggestions = ["Explain the escalation path for suspicious transactions", "Show related documents for customer onboarding", "Summarize the risk policy update"];

export default function Workspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState<Record<string, Message[]>>(defaultThreads);
  const [draft, setDraft] = useState("");
  const [experts, setExperts] = useState<ExpertThread[]>(expertsSeed);
  const [referenceDocuments, setReferenceDocuments] = useState<ReferenceDocument[]>(expertDocuments.gdpr);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadExperts();
  }, []);

  useEffect(() => {
    const expertId = searchParams.get("expert") ?? "gdpr";
    const matchedDocuments = expertDocuments[expertId as keyof typeof expertDocuments] ?? expertDocuments.gdpr;
    setReferenceDocuments(matchedDocuments);
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threads, isTyping, searchParams]);

  const selectedExpertId = experts.some((expert) => expert.id === searchParams.get("expert"))
    ? searchParams.get("expert")!
    : "gdpr";

  const selectedExpert = experts.find((expert) => expert.id === selectedExpertId) ?? experts[0];
  const activeMessages = threads[selectedExpertId] ?? defaultThreads[selectedExpertId] ?? [];

  const loadExperts = async () => {
    try {
      const agents = await getAgents();
      if (agents && agents.length > 0) {
        const mappedExperts = agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          owner: agent.owner,
          description: `${agent.name} knowledge workspace`,
        }));
        setExperts(mappedExperts);
      }
    } catch (error) {
      console.error("Unable to load expert workspace", error);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || draft;
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) {
      return;
    }

    const userMessage: Message = { role: "user", text: trimmed };
    setThreads((current) => ({
      ...current,
      [selectedExpertId]: [...(current[selectedExpertId] ?? defaultThreads[selectedExpertId] ?? []), userMessage],
    }));
    setDraft("");
    setIsTyping(true);

    try {
      const response = await askExpert(selectedExpertId, trimmed);
      setThreads((current) => ({
        ...current,
        [selectedExpertId]: [
          ...(current[selectedExpertId] ?? []),
          {
            role: "assistant",
            text: response.answer,
            sources: response.sources,
          },
        ],
      }));
    } catch (error) {
      console.error("Unable to ask expert", error);
      setThreads((current) => ({
        ...current,
        [selectedExpertId]: [
          ...(current[selectedExpertId] ?? []),
          {
            role: "assistant",
            text: "The expert service is temporarily unavailable. Please retry in a moment.",
          },
        ],
      }));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="shrink-0 mb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary glow-text">AI Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">Intelligent conversational interface</h1>
      </div>

      <div className="flex-1 min-h-0 grid gap-6 xl:grid-cols-[280px_1fr_300px]">
        {/* Left Column: Experts List */}
        <div className="flex flex-col min-h-0">
          <PanelCard title="Experts" subtitle="Active agents" className="flex-1 flex flex-col min-h-0">
            <div className="space-y-2 overflow-y-auto pr-2 -mr-2">
              {experts.map((expert) => (
                <button
                  key={expert.id}
                  onClick={() => setSearchParams({ expert: expert.id })}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${selectedExpertId === expert.id ? "border-primary/50 bg-primary/20 glow-border shadow-[0_0_15px_-3px_var(--primary)]" : "border-white/10 glass-panel/5 hover:glass-panel/10"}`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <MessageSquareText className={`h-4 w-4 ${selectedExpertId === expert.id ? "text-primary" : "text-slate-400"}`} />
                    {expert.name}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{expert.owner}</p>
                </button>
              ))}
            </div>
          </PanelCard>
        </div>

        {/* Middle Column: Chat Interface */}
        <div className="flex flex-col min-h-0 rounded-2xl glass-panel relative overflow-hidden border border-white/10 shadow-2xl shadow-primary/5">
          {/* Chat Header */}
          <div className="shrink-0 border-b border-white/10 bg-black/20 p-4 flex items-center justify-between z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 border border-primary/40 glow-border">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100 glow-text">{selectedExpert.name}</h3>
                <p className="text-xs text-slate-400">{selectedExpert.description}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400 shadow-[0_0_10px_-3px_#34d399] flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 z-10 scroll-smooth">
            <AnimatePresence initial={false}>
              {activeMessages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full mt-1 ${message.role === "user" ? "bg-slate-700 text-slate-300" : "bg-primary/20 text-primary border border-primary/30 glow-border"}`}>
                      {message.role === "user" ? <Sparkles className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    
                    <div className={`rounded-2xl p-4 ${message.role === "user" ? "bg-slate-800/80 border border-white/10 text-slate-200 rounded-tr-sm" : "bg-primary/10 border border-primary/20 text-slate-100 shadow-[0_0_15px_-5px_var(--primary)] rounded-tl-sm"}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-primary/20 flex flex-wrap gap-2">
                          {message.sources.map((source) => (
                            <span key={source} className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary shadow-sm">
                              <FileText className="h-3 w-3" />
                              {source}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full mt-1 bg-primary/20 text-primary border border-primary/30 glow-border">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl p-4 bg-primary/5 border border-primary/10 rounded-tl-sm flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      <span className="text-xs text-primary glow-text">Analyzing context...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="shrink-0 p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl z-10">
            <div className="relative flex items-end gap-2 rounded-2xl border border-white/20 bg-black/60 p-2 shadow-inner focus-within:border-primary/50 focus-within:shadow-[0_0_15px_-3px_var(--primary)] transition-all">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none min-h-[44px] max-h-[120px]"
                placeholder="Message AURA..."
                rows={1}
                disabled={isTyping}
              />
              <button 
                onClick={() => void handleSend()} 
                disabled={isTyping || !draft.trim()}
                className="shrink-0 mb-0.5 mr-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-slate-950 transition hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary glow-border"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-500">
              <Info className="h-3 w-3" />
              AURA can make mistakes. Verify critical banking insights.
            </div>
          </div>
        </div>

        {/* Right Column: References & Suggestions */}
        <div className="flex flex-col min-h-0 space-y-4">
          <PanelCard title="Suggested queries" className="shrink-0">
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <button 
                  key={suggestion} 
                  onClick={() => void handleSend(suggestion)}
                  disabled={isTyping}
                  className="w-full rounded-xl border border-white/10 glass-panel/5 px-3 py-2.5 text-left text-xs text-slate-300 transition-all hover:bg-primary/10 hover:border-primary/40 hover:text-slate-100 hover:shadow-[0_0_10px_-3px_var(--primary)] disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </PanelCard>

          <PanelCard title="Citations" subtitle="Referenced in response" className="flex-1 flex flex-col min-h-0">
            <div className="space-y-2 overflow-y-auto pr-2 -mr-2">
              {(() => {
                const lastAssistantMessage = [...activeMessages].reverse().find(m => m.role === "assistant" && m.sources && m.sources.length > 0);
                const currentSources = lastAssistantMessage?.sources || [];
                
                if (currentSources.length === 0) {
                  return <p className="text-xs text-slate-500 text-center py-4">No sources cited in the latest response.</p>;
                }

                return currentSources.map((sourceName) => (
                  <div key={sourceName} className="flex items-start justify-between rounded-xl border border-white/10 glass-panel/5 p-2.5">
                    <div className="flex gap-2 text-xs text-slate-300">
                      <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="break-words leading-relaxed">{sourceName}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
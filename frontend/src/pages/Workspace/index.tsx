import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Loader2, User, FileJson, ThumbsUp, ThumbsDown, Trash2, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { askExpert, getAgents, getDocuments, submitChatFeedback } from "../../services/omnimindApi";

type Message = {
  role: "assistant" | "user";
  text: string;
  sources?: string[];
  timestamp?: string;
  id?: number;
  confidenceScore?: number;
  feedbackStatus?: "helpful" | "not_helpful" | null;
};

type ExpertThread = {
  id: string;
  name: string;
  owner: string;
  description: string;
  stats: {
    docs: number;
    questions: string;
    accuracy: string;
    updated: string;
  };
};

type ReferenceDocument = {
  name: string;
  confidence: string;
  type: "pdf" | "docx" | "pptx";
  page?: number;
};

const expertsSeed: ExpertThread[] = [
  { id: "kyc", name: "KYC Expert", owner: "Compliance Team", description: "Specialized in Know Your Customer policies, procedures and documentation.", stats: { docs: 128, questions: "24.6k", accuracy: "98%", updated: "2m ago" } },
  { id: "aml", name: "AML Expert", owner: "Risk & Compliance", description: "Specialized in Anti Money Laundering regulations and transaction monitoring.", stats: { docs: 245, questions: "42.1k", accuracy: "97%", updated: "5m ago" } },
  { id: "compliance", name: "Compliance Expert", owner: "Regulatory Board", description: "Broad regulatory compliance and policy guidelines.", stats: { docs: 512, questions: "89k", accuracy: "99%", updated: "1h ago" } },
  { id: "payments", name: "Payments Expert", owner: "Payments Processing", description: "Specialized in cross-border payments and transfer regulations.", stats: { docs: 89, questions: "12.3k", accuracy: "95%", updated: "4h ago" } },
  { id: "risk", name: "Risk Expert", owner: "Enterprise Risk", description: "Operational and enterprise risk assessment frameworks.", stats: { docs: 156, questions: "31k", accuracy: "96%", updated: "1d ago" } },
  { id: "esg", name: "ESG Expert", owner: "Sustainability", description: "Environmental, Social, and Governance reporting standards.", stats: { docs: 73, questions: "5.4k", accuracy: "94%", updated: "2d ago" } },
  { id: "wealth", name: "Wealth Expert", owner: "Wealth Management", description: "High-net-worth client advisory and investment products.", stats: { docs: 310, questions: "55k", accuracy: "98%", updated: "30m ago" } },
];

const expertDocuments: Record<string, ReferenceDocument[]> = {
  kyc: [
    { name: "KYC Policy v4.1.pdf", confidence: "95%", type: "pdf", page: 17 },
    { name: "Customer Due Diligence Guide.pdf", confidence: "92%", type: "pdf", page: 4 },
    { name: "Proof of Address Guidelines.docx", confidence: "88%", type: "docx", page: 2 },
    { name: "German Regulatory Circular.pdf", confidence: "85%", type: "pdf", page: 12 },
    { name: "KYC Training Deck.pptx", confidence: "80%", type: "pptx", page: 8 },
  ],
  aml: [
    { name: "AML Transaction Monitoring.pdf", confidence: "98%", type: "pdf", page: 1 },
    { name: "Suspicious Activity Reporting.docx", confidence: "94%", type: "docx", page: 2 },
  ],
  compliance: [
    { name: "Global Compliance Manual.pdf", confidence: "99%", type: "pdf", page: 5 },
    { name: "Code of Conduct.pdf", confidence: "97%", type: "pdf", page: 10 },
  ],
  payments: [
    { name: "SWIFT Transfer Guidelines.pdf", confidence: "96%", type: "pdf", page: 3 },
    { name: "SEPA Compliance Matrix.xlsx", confidence: "91%", type: "docx", page: 1 },
  ],
  risk: [
    { name: "Enterprise Risk Framework.pdf", confidence: "95%", type: "pdf", page: 22 },
    { name: "Operational Risk Policy.pdf", confidence: "93%", type: "pdf", page: 7 },
  ],
  esg: [
    { name: "Sustainability Report 2024.pdf", confidence: "97%", type: "pdf", page: 14 },
    { name: "Green Bond Framework.pdf", confidence: "92%", type: "pdf", page: 9 },
  ],
  wealth: [
    { name: "HNW Onboarding Guide.pdf", confidence: "98%", type: "pdf", page: 11 },
    { name: "Investment Suitability Matrix.pdf", confidence: "95%", type: "pdf", page: 2 },
  ]
};

const defaultThreads: Record<string, Message[]> = {
  kyc: [
    {
      role: "assistant",
      text: "For corporate clients in Germany, the following documents are acceptable as Proof of Address:\n\n1. Recent utility bill (electricity, gas, water, or telecom) not older than 3 months\n2. Bank statement not older than 3 months\n3. Commercial lease agreement\n4. Property tax statement\n5. Official government correspondence issued within the last 3 months\n\nThe document must clearly show the company name and registered address. P.O. Box addresses are not accepted.",
      sources: ["KYC Policy v4.1.pdf", "German Regulatory Circular.pdf", "Proof of Address Guidelines.docx"],
      timestamp: "10:32 AM"
    },
  ],
  aml: [
    { role: "assistant", text: "I am ready to assist with AML transaction monitoring and suspicious activity reporting. How can I help?", sources: ["AML Transaction Monitoring.pdf"], timestamp: "09:00 AM" },
  ],
  multi: [],
};

export default function Workspace() {
  const [searchParams] = useSearchParams();
  const [threads, setThreads] = useState<Record<string, Message[]>>(defaultThreads);
  const [draft, setDraft] = useState("");
  const [experts, setExperts] = useState<ExpertThread[]>(expertsSeed);
  const [referenceDocuments, setReferenceDocuments] = useState<ReferenceDocument[]>(expertDocuments.kyc);
  const [isTyping, setIsTyping] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [multiAgentMode, setMultiAgentMode] = useState(false);
  const [selectedMultiAgents, setSelectedMultiAgents] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const expertParam = searchParams.get("expert") ?? "kyc";
  const selectedExpertId = experts.some((e) => e.id === expertParam) ? expertParam : "kyc";
  const selectedExpert = experts.find((e) => e.id === selectedExpertId) ?? experts[0];
  const activeMessages = multiAgentMode ? (threads["multi"] ?? []) : (threads[selectedExpertId] ?? defaultThreads[selectedExpertId] ?? []);

  useEffect(() => {
    void loadExperts();
  }, []);

  useEffect(() => {
    async function loadAgentDocs() {
      try {
        const docs = await getDocuments(selectedExpertId);
        const mapped = docs.map(d => {
          let type: "pdf" | "docx" | "pptx" = "pdf";
          if (d.name.toLowerCase().endsWith(".docx")) type = "docx";
          else if (d.name.toLowerCase().endsWith(".pptx")) type = "pptx";

          return {
            name: d.name,
            confidence: "99%", // Placeholder for retrieval confidence
            type
          };
        });
        setReferenceDocuments(mapped);
      } catch (error) {
        console.error("Failed to load reference documents", error);
        setReferenceDocuments([]);
      }
    }
    void loadAgentDocs();
  }, [selectedExpertId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threads, isTyping, searchParams]);

  const loadExperts = async () => {
    try {
      const agents = await getAgents();
      if (agents && agents.length > 0) {
        const mappedExperts = agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          owner: agent.owner,
          description: `${agent.name} knowledge workspace`,
          stats: { docs: 10, questions: "1.2k", accuracy: "95%", updated: "Just now" }
        }));
        setExperts((prev) => {
          const merged = prev.map(p => {
            const found = mappedExperts.find(m => m.id === p.id);
            return found ? { ...p, owner: found.owner, name: found.name } : p;
          });
          return merged;
        });
      }
    } catch (error) {
      console.error("Unable to load expert workspace", error);
    }
  };

  const handleFeedback = async (threadId: string, messageIndex: number, isHelpful: boolean, messageId?: number) => {
    if (!messageId) return;
    try {
      await submitChatFeedback(messageId, isHelpful);
      setThreads((current) => {
        const thread = [...(current[threadId] || [])];
        if (thread[messageIndex]) {
          thread[messageIndex] = {
            ...thread[messageIndex],
            feedbackStatus: isHelpful ? "helpful" : "not_helpful"
          };
        }
        return {
          ...current,
          [threadId]: thread
        };
      });
    } catch (error) {
      console.error("Failed to submit feedback", error);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || draft;
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) {
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: Message = { role: "user", text: trimmed, timestamp };
    const threadId = multiAgentMode ? "multi" : selectedExpertId;

    setThreads((current) => ({
      ...current,
      [threadId]: [...(current[threadId] ?? defaultThreads[threadId] ?? []), userMessage],
    }));
    setDraft("");
    setIsTyping(true);

    if (multiAgentMode) {
      if (selectedMultiAgents.length === 0) {
        setThreads((current) => ({
          ...current,
          multi: [...(current.multi ?? []), { role: "assistant", text: "Please select at least one expert to ask.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
        }));
        setIsTyping(false);
        return;
      }

      // Query multiple agents concurrently
      const promises = selectedMultiAgents.map(async (agentId) => {
        const agent = experts.find(e => e.id === agentId);
        try {
          const response = await askExpert(agentId, trimmed);
          return {
            role: "assistant" as const,
            text: `[${agent?.name}]: ${response.answer}`,
            sources: response.sources,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: response.id,
            confidenceScore: response.confidenceScore,
            feedbackStatus: null
          };
        } catch (_error) {
          return {
            role: "assistant" as const,
            text: `[${agent?.name}]: The expert service is temporarily unavailable.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
      });

      const results = await Promise.all(promises);
      setThreads((current) => ({
        ...current,
        multi: [...(current.multi ?? []), ...results],
      }));
      setIsTyping(false);
    } else {
      try {
        const response = await askExpert(selectedExpertId, trimmed);
        const resTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setThreads((current) => ({
          ...current,
          [selectedExpertId]: [
            ...(current[selectedExpertId] ?? []),
            {
              role: "assistant",
              text: response.answer,
              sources: response.sources,
              timestamp: resTimestamp,
              id: response.id,
              confidenceScore: response.confidenceScore,
              feedbackStatus: null
            },
          ],
        }));
      } catch (_error) {
        const resTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.error("Unable to ask expert", _error);
        setThreads((current) => ({
          ...current,
          [selectedExpertId]: [
            ...(current[selectedExpertId] ?? []),
            {
              role: "assistant",
              text: "The expert service is temporarily unavailable. Please retry in a moment.",
              timestamp: resTimestamp
            },
          ],
        }));
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleClearChat = () => {
    const threadId = multiAgentMode ? "multi" : selectedExpertId;
    setThreads((current) => ({
      ...current,
      [threadId]: []
    }));
  };

  const getDocColor = (type: string) => {
    switch (type) {
      case "pdf": return "text-red-500 bg-red-500/10";
      case "docx": return "text-blue-500 bg-blue-500/10";
      case "pptx": return "text-orange-500 bg-orange-500/10";
      default: return "text-slate-500 bg-slate-500/10";
    }
  };

  const todayString = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* EXPERT TOP BANNER (FLATTENED) */}
      <div className="shrink-0 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5">
        <div className="flex items-center gap-5 relative z-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20">
            <User className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">{selectedExpert.name}</h1>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{selectedExpert.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-8 md:gap-12 relative z-10">
          <div>
            <p className="text-xl font-semibold text-white">{referenceDocuments.length}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Documents</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-white">{selectedExpert.stats.questions}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Questions Answered</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-emerald-400">{selectedExpert.stats.accuracy}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Accuracy</p>
          </div>
          <div className="hidden lg:block">
            <p className="text-xl font-semibold text-white">{selectedExpert.stats.updated}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Last Updated</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid gap-6 xl:grid-cols-[1fr_320px] mt-2">
        {/* Main Column: Chat Interface */}
        <div className="flex flex-col min-h-0 bg-[#06080d] rounded-xl border border-white/5 relative overflow-hidden shadow-lg">

          {/* Chat Tabs */}
          <div className="flex items-center justify-between px-6 border-b border-white/5">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setMultiAgentMode(false)}
                className={`py-4 text-sm font-semibold transition ${!multiAgentMode ? 'text-white border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Chat
              </button>
              <button
                onClick={() => setMultiAgentMode(true)}
                className={`py-4 text-sm font-semibold flex items-center gap-2 transition ${multiAgentMode ? 'text-white border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Ask Multiple Experts <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold tracking-widest">New</span>
              </button>
            </div>
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition"
            >
              <Trash2 size={14} /> Clear Chat
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scroll-smooth custom-scrollbar">
            <AnimatePresence initial={false}>
              {activeMessages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={message.role === "user" ? "text-white" : "text-purple-400"}>
                      {message.role === "user" ? "You" : (multiAgentMode && message.text.startsWith("[") ? message.text.substring(1, message.text.indexOf("]")) : selectedExpert.name)}
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium">{message.timestamp || "10:32 AM"}</span>
                  </div>

                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pl-[1px]">
                    {multiAgentMode && message.role === "assistant" && message.text.startsWith("[") ? message.text.substring(message.text.indexOf("]") + 2) : message.text}
                  </div>

                  {showSources && message.sources && message.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1 pl-[1px]">
                      {message.sources.map((source, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 rounded bg-[#131825] border border-white/10 px-2 py-1 text-[10px] font-medium text-slate-400">
                          <FileJson size={10} className="text-purple-400" /> {source}
                        </span>
                      ))}
                    </div>
                  )}

                  {message.role === "assistant" && (
                    <div className="flex items-center gap-4 mt-2">
                      {message.confidenceScore !== undefined && (
                        <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-1 text-[10px] font-bold border border-emerald-500/20 tracking-wide uppercase">
                          Confidence Score {message.confidenceScore}%
                        </span>
                      )}
                      <button
                        onClick={() => handleFeedback(multiAgentMode ? "multi" : selectedExpertId, index, true, message.id)}
                        disabled={message.feedbackStatus !== null && message.feedbackStatus !== undefined}
                        className={`flex items-center gap-1.5 text-xs font-medium transition ${message.feedbackStatus === "helpful" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300 disabled:opacity-50"}`}>
                        <ThumbsUp size={14} /> Helpful
                      </button>
                      <button
                        onClick={() => handleFeedback(multiAgentMode ? "multi" : selectedExpertId, index, false, message.id)}
                        disabled={message.feedbackStatus !== null && message.feedbackStatus !== undefined}
                        className={`flex items-center gap-1.5 text-xs font-medium transition ${message.feedbackStatus === "not_helpful" ? "text-rose-400" : "text-slate-500 hover:text-slate-300 disabled:opacity-50"}`}>
                        <ThumbsDown size={14} /> Not Helpful
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-purple-400">{multiAgentMode ? "Multiple Experts" : selectedExpert.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                    <span>{multiAgentMode ? "Gathering responses..." : "Analyzing documents..."}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="shrink-0 p-6 pt-2 z-10 border-t border-white/5 bg-[#0b0f19]">

            {multiAgentMode && (
              <div className="mb-4">
                <span className="text-xs font-medium text-slate-500 block mb-2 uppercase tracking-wider">Select Experts to Query</span>
                <div className="flex flex-wrap gap-2">
                  {experts.map(expert => {
                    const isSelected = selectedMultiAgents.includes(expert.id);
                    return (
                      <button
                        key={expert.id}
                        onClick={() => {
                          setSelectedMultiAgents(prev =>
                            isSelected ? prev.filter(id => id !== expert.id) : [...prev, expert.id]
                          );
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${isSelected
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                            : 'bg-[#131825] border-white/10 text-slate-400 hover:text-slate-300 hover:border-white/20'
                          }`}
                      >
                        {expert.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">
                {multiAgentMode ? "Broadcast your query to multiple experts at once." : `${selectedExpert.name} responds only based on uploaded documents.`}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-400 font-medium">Show Sources</span>
                <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${showSources ? 'bg-purple-500' : 'bg-slate-700'}`} onClick={() => setShowSources(!showSources)}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showSources ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>

            <div className="relative flex items-end gap-2 rounded-xl border border-white/10 bg-[#131825] p-2 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
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
                placeholder={multiAgentMode ? "Ask multiple experts..." : `Ask a question about ${selectedExpert.name.split(' ')[0]}...`}
                rows={1}
                disabled={isTyping}
              />
              <div className="flex items-center gap-2 pr-1">
                <button
                  onClick={() => void handleSend()}
                  disabled={isTyping || !draft.trim()}
                  className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:hover:bg-purple-500"
                >
                  <SendHorizonal className="h-5 w-5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: References & Agent Info */}
        <div className="flex flex-col min-h-0 space-y-4">

          {/* Sources Panel */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#06080d] rounded-xl border border-white/5 shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold tracking-wide text-white uppercase">Sources</h3>
              <button className="text-[10px] text-purple-400 font-semibold hover:text-purple-300 transition flex items-center gap-1">
                View All ({referenceDocuments.length}) <ChevronDown size={12} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
              {referenceDocuments.map((doc, i) => (
                <div key={doc.name + i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 rounded p-1.5 ${getDocColor(doc.type)}`}>
                      <FileJson size={14} />
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-300 leading-tight group-hover:text-white transition">{doc.name}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Page {doc.page ?? 1}</span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    {doc.confidence}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Info Panel */}
          <div className="shrink-0 bg-[#06080d] rounded-xl border border-white/5 shadow-lg p-5">
            <h3 className="text-sm font-bold tracking-wide text-white uppercase mb-4">Agent Info</h3>
            <div className="space-y-3">
              {[
                { label: "Owner", value: selectedExpert.owner },
                { label: "Created", value: todayString },
                { label: "Last Updated", value: selectedExpert.stats.updated },
                { label: "Model", value: "OmniMind Core v2.1" },
                { label: "Data Sources", value: referenceDocuments.length.toString() },
                { label: "Access", value: "All Internal Users" },
              ].map((info) => (
                <div key={info.label} className="flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-medium">{info.label}</div>
                  <div className="font-semibold text-slate-300">{info.value}</div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-white/5">
                <Link to={`/knowledge?expert=${selectedExpertId}`} className="block w-full text-center text-xs font-bold text-slate-400 hover:text-white transition uppercase tracking-widest border border-white/10 rounded-lg py-2 hover:bg-white/5">
                  View Knowledge Base
                </Link>
              </div>
            </div>
          </div>

          {/* Usage Analytics Panel */}
          <div className="shrink-0 bg-[#06080d] rounded-xl border border-white/5 shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold tracking-wide text-white uppercase">Usage Analytics</h3>
              <button className="text-[10px] text-slate-400 font-semibold hover:text-white transition flex items-center gap-1">
                This Month <ChevronDown size={12} />
              </button>
            </div>

            {/* Fake SVG Sparkline */}
            <div className="h-12 w-full mb-4">
              <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible preserve-aspect-ratio-none">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
                    <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
                  </linearGradient>
                </defs>
                <path d="M0,25 L10,20 L20,28 L30,15 L40,18 L50,8 L60,12 L70,5 L80,10 L90,2 L100,5"
                  fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0,25 L10,20 L20,28 L30,15 L40,18 L50,8 L60,12 L70,5 L80,10 L90,2 L100,5 L100,30 L0,30 Z"
                  fill="url(#lineGrad)" />
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-bold text-white">{selectedExpert.stats.questions}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Questions</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{(parseFloat(selectedExpert.stats.questions) * 0.8).toFixed(1)}{selectedExpert.stats.questions.includes('k') ? 'k' : ''}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Active Users</p>
              </div>
              <div className="col-span-2">
                <p className="text-lg font-bold text-emerald-400">{selectedExpert.stats.accuracy}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Satisfaction</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
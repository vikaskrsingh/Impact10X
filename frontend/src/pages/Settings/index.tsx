import { BellRing, KeyRound, RefreshCw, ShieldCheck, UserCircle2 } from "lucide-react";
import { PanelCard } from "../../components/common/PanelCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStoredRole, getStoredUsername } from "@/utils/auth";

const preferences = [
  { label: "Expert approval alerts", value: "On" },
  { label: "Knowledge updates", value: "On" },
  { label: "Weekly digest", value: "Email" },
];

const integrations = [
  { name: "Vertex AI", status: "Connected" },
  { name: "Google Cloud Storage", status: "Connected" },
  { name: "Slack", status: "Pending" },
];

export default function Settings() {
  const role = getStoredRole();
  const username = getStoredUsername();
  const isAdmin = role === "admin";
  const displayName = username || (isAdmin ? "System Administrator" : "Compliance Expert");
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary glow-text">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Configure your workspace preferences</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Tune alerts, integrations, and account preferences for the operational workspace.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelCard title="Profile" subtitle="Regional and user preferences">
          <div className="rounded-xl border border-slate-200 glass-panel/5 border border-white/10 p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-primary/50 shadow-[0_0_15px_var(--primary)]">
                  <AvatarFallback className="text-xl text-primary bg-primary/20">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-100">
                    {displayName}
                  </p>
                  <p className="text-sm text-slate-400">
                    {isAdmin ? "Platform Admin" : "Knowledge Expert"}
                  </p>
                </div>
              </div>
            <div className="mt-4 rounded-xl border border-slate-200 glass-panel p-3 text-sm text-slate-400">
              Preferred working hours: 08:00–18:00 GMT
            </div>
          </div>
        </PanelCard>

        <PanelCard title="Notifications" subtitle="Keep teams aligned on approvals and uploads">
          <div className="space-y-2 text-sm text-slate-400">
            {preferences.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg glass-panel/5 border border-white/10 px-3 py-2">
                <span>{item.label}</span>
                <span className="font-semibold text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Security & integrations" subtitle="Secure access tokens for integrations">
          <div className="space-y-3">
            {integrations.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 glass-panel/5 border border-white/10 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  {item.name === "Vertex AI" ? <KeyRound className="h-4 w-4 text-primary glow-text" /> : item.name === "Google Cloud Storage" ? <RefreshCw className="h-4 w-4 text-primary glow-text" /> : <BellRing className="h-4 w-4 text-primary glow-text" />}
                  {item.name}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "Connected" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{item.status}</span>
              </div>
            ))}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Secret rotation is enabled for production connectors.
              </div>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
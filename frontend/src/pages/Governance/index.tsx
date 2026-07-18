import { FileCheck2, ShieldCheck, UserCog, Clock3 } from "lucide-react";
import { PanelCard } from "../../components/common/PanelCard";

const accessRows = [
  { name: "System Administrator", role: "Data Protection Officer", access: "Full", status: "Active" },
  { name: "Compliance Expert", role: "Risk Analyst", access: "Restricted", status: "Active" },
  { name: "Rajdeep", role: "ECB Reporting Lead", access: "Full", status: "Pending review" },
];

const approvals = [
  { title: "Payments Fraud policy pack", detail: "Awaiting second approver", state: "Pending" },
  { title: "KYC onboarding SOP", detail: "Approved by DPO", state: "Approved" },
  { title: "AML Treasury controls", detail: "Pending legal review", state: "In review" },
];

const auditLog = [
  { action: "EU Policy update approved", actor: "System Administrator", time: "12 mins ago" },
  { action: "New agent workspace created", actor: "Rajdeep", time: "1 hr ago" },
  { action: "Access review requested", actor: "Platform Admin", time: "Yesterday" },
];

export default function Governance() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary glow-text">Governance</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Secure roles, permissions, and audit trails</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Keep approvals moving while protecting sensitive knowledge and access boundaries.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <PanelCard title="Access controls" subtitle="Users and permissions across the banking knowledge estate">
          <div className="space-y-3">
            {accessRows.map((row) => (
              <div key={row.name} className="flex flex-col gap-3 rounded-xl border border-slate-200 glass-panel/5 border border-white/10 p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2 text-primary">
                    <UserCog className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{row.name}</p>
                    <p className="text-sm text-slate-400">{row.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400">{row.access}</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{row.status}</span>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Approval workflow" subtitle="Knowledge approvals and policy sign-off status">
          <div className="space-y-4">
            {approvals.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary glow-text" />
                    {item.title}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400">{item.state}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Audit trail" subtitle="Recent governance activity across the platform">
        <div className="space-y-3">
          {auditLog.map((entry) => (
            <div key={entry.action} className="flex flex-col gap-2 rounded-xl border border-slate-200 glass-panel/5 border border-white/10 p-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <FileCheck2 className="h-4 w-4 text-primary glow-text" />
                {entry.action}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock3 className="h-4 w-4" />
                {entry.actor} • {entry.time}
              </div>
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}
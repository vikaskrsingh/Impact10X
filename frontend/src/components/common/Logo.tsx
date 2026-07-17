export default function Logo() {
  return (
    <div className="flex items-center gap-3 px-4 py-6">
      <div className="flex h-10 px-3 items-center justify-center rounded-xl bg-primary/20 border border-primary/50 text-primary glow-text text-xl font-bold shadow-[0_0_15px_-3px_var(--primary)]">
        AURA
      </div>

      <div>
        <p className="text-xs font-medium text-slate-300 uppercase tracking-widest mt-1">
          AI Knowledge Platform
        </p>
      </div>
    </div>
  );
}
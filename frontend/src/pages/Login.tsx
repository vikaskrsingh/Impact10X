import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, User } from "lucide-react";
import type { UserRole } from "../utils/auth";
import { setStoredRole } from "../utils/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUsername = username.trim().toLowerCase();
    const role: UserRole = normalizedUsername.includes("expert") ? "expert" : "admin";

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setStoredRole(role);
    setError("");
    navigate(role === "admin" ? "/" : "/workspace");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600/20 p-3 text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">AURA access</p>
            <h1 className="text-2xl font-semibold">Sign in to your workspace</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Enter your credentials to access the AURA environment. Usernames containing “expert” route to the expert view, otherwise they open the admin experience.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="username">
              Username
            </label>
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2">
              <User className="mr-2 h-4 w-4 text-slate-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
              Password
            </label>
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2">
              <Lock className="mr-2 h-4 w-4 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/20 border border-primary/50 shadow-[0_0_15px_-3px_var(--primary)]0"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

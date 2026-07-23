import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, ArrowRight, Activity, Database, Fingerprint, Loader2 } from "lucide-react";
import type { UserRole } from "../utils/auth";
import { setStoredRole, setStoredUsername, setStoredToken } from "../utils/auth";
import { login } from "../services/omnimindApi";
import { motion } from "framer-motion";
import Logo from "../components/common/Logo";

export default function Login() {
 const [username, setUsername] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate();

 const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!username.trim() || !password.trim()) {
   setError("Please enter both username and password.");
   return;
  }

  setIsLoading(true);
  setError("");

  try {
   const response = await login(username.trim(), password);
   
   setStoredToken(response.access_token);
   setStoredRole(response.role as UserRole);
   setStoredUsername(username.trim());
   
   navigate(response.role === "admin" ? "/" : "/workspace");
  } catch (err: any) {
   setError(err.message || "Invalid username or password.");
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <div className="flex min-h-screen bg-slate-950 text-white overflow-hidden">

   {/* LEFT SIDE - Presentation Panel */}
   <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 border-r border-white/5 items-center justify-center overflow-hidden">
    {/* Background glow effects */}
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-slate-900 to-slate-950 pointer-events-none " />
    <div className="absolute -left-1/4 -bottom-1/4 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

    {/* Floating Abstract Elements */}
    <div className="relative z-10 p-12 max-w-lg w-full">
     <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
     >
      <div className="-ml-4 mb-8">
       <Logo />
      </div>

      <h1 className="text-4xl font-light leading-tight mb-6">
       Banking AI <br />
       <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 glow-text">Knowledge Center</span>
      </h1>

      <p className="text-slate-400 mb-12 text-lg">
       A secure, centralized platform to deploy specialized AI experts grounded in your banking operations and regulatory knowledge.
      </p>

      <div className="space-y-6">
       {[
        { icon: Activity, title: "Customizable AI Agents", desc: "Deploy specialized banking domain experts or build your own." },
        { icon: Fingerprint, title: "Google Cloud Native", desc: "Scalable, secure infrastructure built for GCP deployment." },
        { icon: Database, title: "Governance Dashboard", desc: "Full administrative controls and detailed audit logging." }
       ].map((feature, i) => (
        <motion.div
         key={i}
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
         className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl glass-panel"
        >
         <div className="bg-primary/20 p-3 rounded-xl text-primary border border-primary/20">
          <feature.icon className="h-5 w-5" />
         </div>
         <div>
          <h3 className="font-semibold text-slate-200">{feature.title}</h3>
          <p className="text-sm text-slate-500">{feature.desc}</p>
         </div>
        </motion.div>
       ))}
      </div>
     </motion.div>
    </div>
   </div>

   {/* RIGHT SIDE - Login Form */}
   <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
    <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

    <motion.div
     initial={{ opacity: 0, scale: 0.95 }}
     animate={{ opacity: 1, scale: 1 }}
     transition={{ duration: 0.5, delay: 0.2 }}
     className="w-full max-w-md"
    >
     <div className="mb-10 text-center lg:text-left">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary glow-text mb-3">Authentication</p>
      <h2 className="text-3xl font-light tracking-tight text-white mb-2">Welcome Back</h2>
      <p className="text-sm text-slate-400 dark:text-slate-400">Sign in to your operational workspace.</p>
     </div>

     <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
       <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400" htmlFor="username">
        Username
       </label>
       <div className="group flex items-center rounded-xl border border-white/10 bg-black/40 px-4 py-3 transition-all focus-within:border-primary/50 focus-within:bg-black/60 focus-within:shadow-[0_0_15px_rgba(0,163,255,0.15)]">
        <User className="mr-3 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
        <input
         id="username"
         type="text"
         value={username}
         onChange={(event) => setUsername(event.target.value)}
         placeholder="Enter your username"
         className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
        />
       </div>
      </div>

      <div>
       <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400" htmlFor="password">
        Password
       </label>
       <div className="group flex items-center rounded-xl border border-white/10 bg-black/40 px-4 py-3 transition-all focus-within:border-primary/50 focus-within:bg-black/60 focus-within:shadow-[0_0_15px_rgba(0,163,255,0.15)]">
        <Lock className="mr-3 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
        <input
         id="password"
         type="password"
         value={password}
         onChange={(event) => setPassword(event.target.value)}
         placeholder="Enter your password"
         className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
        />
       </div>
      </div>

      {error && (
       <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg"
       >
        {error}
       </motion.p>
      )}

      <div className="flex items-center justify-between">
       <label className="flex items-center space-x-3 cursor-pointer group">
        <div className="relative flex items-center justify-center w-5 h-5 border border-slate-600 rounded bg-black/40 group-hover:border-primary/50 transition-colors">
         <input type="checkbox" className="absolute w-full h-full opacity-0 cursor-pointer peer" defaultChecked />
         <svg className="w-3 h-3 text-primary opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
         </svg>
        </div>
        <span className="text-sm text-slate-400 dark:text-slate-400 group-hover:text-slate-300 transition-colors">Keep me signed in</span>
       </label>

       <button type="button" onClick={() => alert("Password reset functionality is disabled.")} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
        Forgot password?
       </button>
      </div>

      <motion.button
       whileHover={!isLoading ? { scale: 1.01 } : {}}
       whileTap={!isLoading ? { scale: 0.98 } : {}}
       disabled={isLoading}
       type="submit"
       className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-black transition-all hover:bg-primary/90 shadow-[0_0_20px_var(--primary)] disabled:opacity-70 disabled:cursor-not-allowed"
      >
       {isLoading ? (
        <>
         <Loader2 className="h-5 w-5 animate-spin" />
         Authenticating...
        </>
       ) : (
        <>
         Sign In to Workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </>
       )}
      </motion.button>
     </form>

     <div className="mt-8 flex items-center justify-center space-x-4">
      <div className="h-[1px] flex-1 bg-white/10" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Or continue with</span>
      <div className="h-[1px] flex-1 bg-white/10" />
     </div>
     
     <div className="mt-6 flex flex-col sm:flex-row gap-4">
      <button 
       type="button"
       onClick={() => alert("Single Sign-On is not configured for this demo environment.")}
       className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-white/5 hover:text-white"
      >
       <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4 24H0V12.6H11.4V24ZM24 24H12.6V12.6H24V24ZM11.4 11.4H0V0H11.4V11.4ZM24 11.4H12.6V0H24V11.4Z" fill="#00A4EF"/></svg>
       Microsoft Entra
      </button>
      <button 
       type="button"
       onClick={() => alert("Single Sign-On is not configured for this demo environment.")}
       className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-white/5 hover:text-white"
      >
       <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12C24 5.373 18.627 0 12 0zm0 19.5c-4.142 0-7.5-3.358-7.5-7.5S7.858 4.5 12 4.5s7.5 3.358 7.5 7.5-3.358 7.5-7.5 7.5z" fill="#007DC1"/></svg>
       Okta
      </button>
     </div>

     <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
      <p>
       By authenticating, you agree to the <a href="#" className="text-primary hover:underline">enterprise data policy</a>.
      </p>
      <div className="flex gap-4 mt-2 sm:mt-0">
       <span className="opacity-60">OmniMind v2.4.1</span>
       <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
       <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
      </div>
     </div>
    </motion.div>
   </div>
  </div>
 );
}

import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";

import Dashboard from "../pages/Dashboard";
import ExpertHub from "../pages/ExpertHub";
import Login from "../pages/Login";
import Workspace from "../pages/Workspace";
import KnowledgeCenter from "../pages/KnowledgeCenter";
import Governance from "../pages/Governance";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import { getStoredRole, isAdminRole } from "@/utils/auth";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const role = getStoredRole();
  return role !== null ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const role = getStoredRole();
  return role !== null && isAdminRole(role) ? children : <Navigate to="/workspace" replace />;
}

function RootRoute() {
  const role = getStoredRole();
  if (!role) return <Navigate to="/login" replace />;
  if (role === "admin") return <Dashboard />;
  return <Navigate to="/workspace" replace />;
}

function LoginRoute() {
  const role = getStoredRole();
  if (role === "admin") return <Navigate to="/" replace />;
  if (role === "expert") return <Navigate to="/workspace" replace />;
  return <Login />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<RootRoute />} />
          <Route path="/experts" element={<AdminRoute><ExpertHub /></AdminRoute>} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/knowledge" element={<KnowledgeCenter />} />
          <Route path="/governance" element={<AdminRoute><Governance /></AdminRoute>} />
          <Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
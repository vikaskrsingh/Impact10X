import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  FolderOpen,
  Shield,
  BarChart3,
  Settings,
} from "lucide-react";
import { isAdminRole, type UserRole } from "@/utils/auth";

const allNavigation = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    desc: "Platform overview & metrics",
  },
  {
    title: "AI Expert Hub",
    icon: Bot,
    path: "/experts",
    desc: "Manage & configure agents",
  },
  {
    title: "AI Workspace",
    icon: MessageSquare,
    path: "/workspace",
    desc: "Chat with your AI experts",
  },
  {
    title: "Knowledge Center",
    icon: FolderOpen,
    path: "/knowledge",
    desc: "Upload & sync documents",
  },
  {
    title: "Governance",
    icon: Shield,
    path: "/governance",
    desc: "Access control & audits",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/analytics",
    desc: "Usage & performance data",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
    desc: "System configuration",
  },
];

export function getNavigation(role?: UserRole | null) {
  if (!isAdminRole(role)) {
    return allNavigation.filter((item) => ["Dashboard", "AI Workspace"].includes(item.title));
  }

  return allNavigation;
}
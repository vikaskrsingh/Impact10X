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
  },
  {
    title: "AI Expert Hub",
    icon: Bot,
    path: "/experts",
  },
  {
    title: "AI Workspace",
    icon: MessageSquare,
    path: "/workspace",
  },
  {
    title: "Knowledge Center",
    icon: FolderOpen,
    path: "/knowledge",
  },
  {
    title: "Governance",
    icon: Shield,
    path: "/governance",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export function getNavigation(role?: UserRole | null) {
  if (!isAdminRole(role)) {
    return allNavigation.filter((item) => ["Dashboard", "AI Workspace"].includes(item.title));
  }

  return allNavigation;
}
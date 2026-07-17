import type { Expert } from "../types/expert";

export const experts: Expert[] = [
  {
    id: "kyc",
    name: "KYC Expert",
    description: "Customer onboarding, KYC regulations and documentation.",
    category: "Compliance",
    documents: 128,
    trustScore: 98,
    lastUpdated: "2 hours ago",
    icon: "🤖",
  },
  {
    id: "aml",
    name: "AML Expert",
    description: "AML policies, sanctions and transaction monitoring.",
    category: "Risk",
    documents: 96,
    trustScore: 97,
    lastUpdated: "5 hours ago",
    icon: "💰",
  },
  {
    id: "compliance",
    name: "Compliance Expert",
    description: "Banking compliance, audit and regulatory controls.",
    category: "Governance",
    documents: 214,
    trustScore: 99,
    lastUpdated: "Yesterday",
    icon: "⚖️",
  },
];
import type { Expert } from "../types/expert";

const experts: Expert[] = [
  {
    id: "1",
    name: "KYC Expert",
    description: "Customer onboarding policies",
    category: "Compliance",
    icon: "🤖",
    documents: 128,
    trustScore: 98,
    lastUpdated: "Today"
  },
  {
    id: "2",
    name: "AML Expert",
    description: "Anti Money Laundering",
    category: "Risk",
    icon: "💰",
    documents: 92,
    trustScore: 97,
    lastUpdated: "Yesterday"
  }
];

export function getExperts() {
  return experts;
}

export function addExpert(expert: Expert) {
  experts.push(expert);
}
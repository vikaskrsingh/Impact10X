export interface Expert {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  documents: number;
  trustScore: number;
  lastUpdated: string;
}
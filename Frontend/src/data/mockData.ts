export interface PromptEntry {
  id: string;
  snippet: string;
  sanitized: string;
  injections: string[];
  timestamp: Date;
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  source: string;
  validation: {
    characterFiltering: "pass" | "fail";
    encodingCheck: "pass" | "fail";
  };
  heuristics: {
    length: number;
    complexity: number;
    contextualShift: number;
    entropy: number;
    repetition: number;
  };
  mlInsight: string;
  flagged: boolean;
  downstreamOutput?: string;
  safetyReview?: {
    safe: boolean;
    verdict: "safe" | "unsafe" | "unknown";
    reason: string;
  };
}

export interface ValidationProject {
  id: string;
  industry: string;
  subIndustry: string;
  projectName: string;
  projectDescription: string;
  goldStandardSummary: string;
  goldStandardPrompt: string;
  relevanceScores: {
    accuracy: number;
    completeness: number;
    usefulness: number;
    efficiency: number;
  };
}

export interface ValidationMetrics {
  similarityScore: number;
  promptExecutionSuccessRate: number;
  userFeedbackScore: number;
  timeSavings: number;
}

export interface ValidationResult {
  projectId: string;
  generatedSummary: string;
  generatedPrompt: string;
  metrics: ValidationMetrics;
  timestamp: Date;
}

export interface ValidationSet {
  projects: ValidationProject[];
  industry: string;
  subIndustry: string;
  version: string;
  createdAt: Date;
} 
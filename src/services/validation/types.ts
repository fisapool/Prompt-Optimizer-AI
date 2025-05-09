export interface ValidationTestCase {
  id: string;
  industry: string;
  inputFiles: {
    name: string;
    content: string;
    mimeType: string;
  }[];
  expectedSummary: {
    keyPoints: string[];
    requiredElements: string[];
  };
  expectedSuggestions: {
    requiredTypes: string[];
    minCount: number;
    maxCount: number;
  };
  expectedOptimizedPrompt: {
    requiredElements: string[];
    maxLength: number;
    format: 'markdown' | 'plain' | 'json';
  };
}

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
  testCaseId: string;
  timestamp: number;
  summaryScore: number;
  suggestionsScore: number;
  optimizedPromptScore: number;
  overallScore: number;
  summary: string;
  optimizedPrompt: string;
  suggestions: string[];
  error?: {
    message: string;
    type: string;
  };
  details: {
    summary: {
      accuracy: number;
      completeness: number;
      relevance: number;
    };
    suggestions: {
      relevance: number;
      usefulness: number;
      industryAlignment: number;
    };
    optimizedPrompt: {
      clarity: number;
      completeness: number;
      formatCompliance: number;
    };
  };
}

export interface ValidationSet {
  projects: ValidationProject[];
  industry: string;
  subIndustry: string;
  version: string;
  createdAt: Date;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  variants: {
    id: string;
    name: string;
    config: {
      summarizationParams: Record<string, any>;
      suggestionParams: Record<string, any>;
      optimizationParams: Record<string, any>;
    };
  }[];
  metrics: {
    primary: string[];
    secondary: string[];
  };
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  timestamp: number;
  metrics: { [key: string]: number };
  userFeedback?: {
    rating: number;
    comments?: string;
  };
} 
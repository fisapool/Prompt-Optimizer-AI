import { ValidationProject, ValidationMetrics } from '../validation/types';

export interface IndustryPlugin {
  industry: string;
  subIndustries: string[];
  getPromptTemplate(task: string): string;
  analyzeProject(projectData: string): ProjectAnalysis;
  validateProject(project: ValidationProject): ValidationMetrics;
  getIndustrySpecificMetrics(): IndustryMetrics;
}

export interface ProjectAnalysis {
  keyTasks: string[];
  goals: string[];
  requirements: string[];
  constraints: string[];
  industrySpecificInsights: Record<string, any>;
}

export interface IndustryMetrics {
  requiredAccuracy: number;
  requiredCompleteness: number;
  requiredUsefulness: number;
  requiredEfficiency: number;
  industrySpecificMetrics: Record<string, number>;
}

export interface PluginConfig {
  industry: string;
  subIndustry: string;
  version: string;
  enabled: boolean;
  settings: Record<string, any>;
} 
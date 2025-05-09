import { IndustryPlugin, ProjectAnalysis, IndustryMetrics } from './types';
import { ValidationProject, ValidationMetrics } from '../validation/types';
import { cosineSimilarity } from '../utils/similarity';

export abstract class BasePlugin implements IndustryPlugin {
  abstract industry: string;
  abstract subIndustries: string[];

  protected readonly genericPromptTemplate = `Summarize the following project data and extract key tasks and goals:
{projectData}

Industry: {industry}
Task: {task}
Output Format: {outputFormat}

Additional Context:
{additionalContext}
`;

  abstract getPromptTemplate(task: string): string;
  abstract analyzeProject(projectData: string): ProjectAnalysis;
  abstract getIndustrySpecificMetrics(): IndustryMetrics;

  validateProject(project: ValidationProject): ValidationMetrics {
    const metrics = this.getIndustrySpecificMetrics();
    
    // Calculate similarity scores
    const summarySimilarity = cosineSimilarity(
      project.goldStandardSummary,
      project.projectDescription
    );

    const promptSimilarity = cosineSimilarity(
      project.goldStandardPrompt,
      this.getPromptTemplate('default')
    );

    // Calculate weighted metrics based on industry requirements
    return {
      similarityScore: (summarySimilarity + promptSimilarity) / 2,
      promptExecutionSuccessRate: this.calculateSuccessRate(project),
      userFeedbackScore: this.calculateUserFeedback(project),
      timeSavings: this.calculateTimeSavings(project)
    };
  }

  protected calculateSuccessRate(project: ValidationProject): number {
    // Base implementation - can be overridden by specific plugins
    return 0.85;
  }

  protected calculateUserFeedback(project: ValidationProject): number {
    // Base implementation - can be overridden by specific plugins
    return project.relevanceScores.usefulness;
  }

  protected calculateTimeSavings(project: ValidationProject): number {
    // Base implementation - can be overridden by specific plugins
    return project.relevanceScores.efficiency;
  }

  protected validateIndustrySpecificRequirements(project: ValidationProject): boolean {
    const metrics = this.getIndustrySpecificMetrics();
    return (
      project.relevanceScores.accuracy >= metrics.requiredAccuracy &&
      project.relevanceScores.completeness >= metrics.requiredCompleteness &&
      project.relevanceScores.usefulness >= metrics.requiredUsefulness &&
      project.relevanceScores.efficiency >= metrics.requiredEfficiency
    );
  }
} 
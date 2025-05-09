import { ValidationProject, ValidationMetrics, ValidationResult } from './types';
import { cosineSimilarity } from '../utils/similarity';

export class ValidationService {
  private static instance: ValidationService;
  private validationResults: ValidationResult[] = [];

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  public async evaluateSummary(
    project: ValidationProject,
    generatedSummary: string
  ): Promise<ValidationMetrics> {
    // Calculate similarity score using cosine similarity
    const similarityScore = cosineSimilarity(
      project.goldStandardSummary,
      generatedSummary
    );

    // Mock metrics for now - these would be replaced with actual implementations
    const metrics: ValidationMetrics = {
      similarityScore,
      promptExecutionSuccessRate: 0.85, // This would be calculated based on actual execution results
      userFeedbackScore: 0, // This would be updated based on user feedback
      timeSavings: 0, // This would be calculated based on actual time measurements
    };

    return metrics;
  }

  public async evaluatePrompt(
    project: ValidationProject,
    generatedPrompt: string
  ): Promise<ValidationMetrics> {
    // Similar evaluation logic for prompts
    const similarityScore = cosineSimilarity(
      project.goldStandardPrompt,
      generatedPrompt
    );

    const metrics: ValidationMetrics = {
      similarityScore,
      promptExecutionSuccessRate: 0.85,
      userFeedbackScore: 0,
      timeSavings: 0,
    };

    return metrics;
  }

  public recordValidationResult(result: ValidationResult): void {
    this.validationResults.push(result);
  }

  public getValidationResults(): ValidationResult[] {
    return this.validationResults;
  }

  public calculateAverageMetrics(): ValidationMetrics {
    if (this.validationResults.length === 0) {
      throw new Error('No validation results available');
    }

    const sumMetrics = this.validationResults.reduce(
      (acc, result) => ({
        similarityScore: acc.similarityScore + result.metrics.similarityScore,
        promptExecutionSuccessRate:
          acc.promptExecutionSuccessRate + result.metrics.promptExecutionSuccessRate,
        userFeedbackScore: acc.userFeedbackScore + result.metrics.userFeedbackScore,
        timeSavings: acc.timeSavings + result.metrics.timeSavings,
      }),
      {
        similarityScore: 0,
        promptExecutionSuccessRate: 0,
        userFeedbackScore: 0,
        timeSavings: 0,
      }
    );

    const count = this.validationResults.length;
    return {
      similarityScore: sumMetrics.similarityScore / count,
      promptExecutionSuccessRate: sumMetrics.promptExecutionSuccessRate / count,
      userFeedbackScore: sumMetrics.userFeedbackScore / count,
      timeSavings: sumMetrics.timeSavings / count,
    };
  }
} 
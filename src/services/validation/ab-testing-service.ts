import { ABTestConfig, ABTestResult } from './types';
import { summarizeProjectData } from '@/ai/flows/summarize-project-data';
import { generatePromptSuggestions } from '@/ai/flows/generate-prompt-suggestions';
import { generateOptimizedPrompt } from '@/ai/flows/generate-optimized-prompt';

export class ABTestingService {
  private tests: Map<string, ABTestConfig> = new Map();
  private results: ABTestResult[] = [];

  async createTest(config: ABTestConfig): Promise<void> {
    this.tests.set(config.id, config);
  }

  async assignVariant(testId: string, userId: string): Promise<string> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    // Simple random assignment for now
    const variantIndex = Math.floor(Math.random() * test.variants.length);
    return test.variants[variantIndex].id;
  }

  async runTest(testId: string, userId: string, input: {
    files: { name: string; content: string; mimeType: string; }[];
    industry: string;
  }): Promise<ABTestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const variantId = await this.assignVariant(testId, userId);
    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    // Run the pipeline with variant-specific parameters
    const summaryResult = await summarizeProjectData({
      files: input.files.map(f => ({
        fileDataUri: `data:${f.mimeType};base64,${Buffer.from(f.content).toString('base64')}`,
        fileName: f.name,
        mimeType: f.mimeType,
      })),
      industry: input.industry,
      ...variant.config.summarizationParams,
    });

    const suggestionsResult = await generatePromptSuggestions({
      combinedFileTextContent: input.files.map(f => f.content).join('\n'),
      projectSummary: summaryResult.summary,
      industry: input.industry,
      ...variant.config.suggestionParams,
    });

    const optimizedPromptResult = await generateOptimizedPrompt({
      industry: input.industry,
      projectSummary: summaryResult.summary,
      combinedFileTextContent: input.files.map(f => f.content),
      customizations: suggestionsResult.suggestions,
      ...variant.config.optimizationParams,
    });

    // Calculate metrics
    const metrics = this.calculateMetrics({
      summary: summaryResult.summary,
      suggestions: suggestionsResult.suggestions,
      optimizedPrompt: optimizedPromptResult.optimizedPrompt,
    });

    const result: ABTestResult = {
      testId,
      variantId,
      userId,
      timestamp: Date.now(),
      metrics,
    };

    this.results.push(result);
    return result;
  }

  async addFeedback(testId: string, userId: string, feedback: {
    rating: number;
    comments?: string;
  }): Promise<void> {
    const result = this.results.find(r => 
      r.testId === testId && r.userId === userId
    );
    if (result) {
      result.userFeedback = feedback;
    }
  }

  async getTestResults(testId: string): Promise<{
    variantResults: {
      [variantId: string]: {
        metrics: { [key: string]: number };
        feedback: { rating: number; count: number };
      };
    };
    overallMetrics: { [key: string]: number };
  }> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const variantResults: { [key: string]: any } = {};
    const overallMetrics: { [key: string]: number[] } = {};

    // Initialize variant results
    test.variants.forEach(variant => {
      variantResults[variant.id] = {
        metrics: {},
        feedback: { rating: 0, count: 0 },
      };
    });

    // Aggregate results
    this.results
      .filter(r => r.testId === testId)
      .forEach(result => {
        // Aggregate metrics
        Object.entries(result.metrics).forEach(([key, value]) => {
          if (!variantResults[result.variantId].metrics[key]) {
            variantResults[result.variantId].metrics[key] = [];
          }
          variantResults[result.variantId].metrics[key].push(value);

          if (!overallMetrics[key]) {
            overallMetrics[key] = [];
          }
          overallMetrics[key].push(value);
        });

        // Aggregate feedback
        if (result.userFeedback) {
          variantResults[result.variantId].feedback.rating += result.userFeedback.rating;
          variantResults[result.variantId].feedback.count++;
        }
      });

    // Calculate averages
    Object.keys(variantResults).forEach(variantId => {
      Object.keys(variantResults[variantId].metrics).forEach(metric => {
        const values = variantResults[variantId].metrics[metric];
        variantResults[variantId].metrics[metric] = 
          values.reduce((a: number, b: number) => a + b, 0) / values.length;
      });

      if (variantResults[variantId].feedback.count > 0) {
        variantResults[variantId].feedback.rating /= 
          variantResults[variantId].feedback.count;
      }
    });

    // Calculate overall averages
    const finalOverallMetrics: { [key: string]: number } = {};
    Object.entries(overallMetrics).forEach(([key, values]) => {
      finalOverallMetrics[key] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return {
      variantResults,
      overallMetrics: finalOverallMetrics,
    };
  }

  private calculateMetrics(output: {
    summary: string;
    suggestions: string[];
    optimizedPrompt: string;
  }): { [key: string]: number } {
    return {
      summaryLength: output.summary.length,
      suggestionsCount: output.suggestions.length,
      optimizedPromptLength: output.optimizedPrompt.length,
      // Add more metrics as needed
    };
  }
} 
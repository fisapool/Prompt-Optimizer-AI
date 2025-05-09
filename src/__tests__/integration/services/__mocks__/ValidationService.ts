import { ValidationTestCase, ValidationResult } from '../../../../services/validation/types';
import { summarizeProjectData } from '../../../../ai/flows/summarize-project-data';
import { generatePromptSuggestions } from '../../../../ai/flows/generate-prompt-suggestions';
import { generateOptimizedPrompt } from '../../../../ai/flows/generate-optimized-prompt';

export class MockValidationService {
  private testCases: ValidationTestCase[] = [];

  async addTestCase(testCase: ValidationTestCase): Promise<void> {
    this.testCases.push(testCase);
  }

  async runValidation(testCaseId: string): Promise<ValidationResult> {
    const testCase = this.testCases.find(tc => tc.id === testCaseId);
    if (!testCase) {
      throw new Error(`Test case ${testCaseId} not found`);
    }

    // Run the full pipeline using mocked AI flows
    const summaryResult = await summarizeProjectData({
      files: testCase.inputFiles.map(f => ({
        fileDataUri: `data:${f.mimeType};base64,${Buffer.from(f.content).toString('base64')}`,
        fileName: f.name,
        mimeType: f.mimeType,
      })),
      industry: testCase.industry,
    });

    const suggestionsResult = await generatePromptSuggestions({
      combinedFileTextContent: testCase.inputFiles.map(f => f.content).join('\n'),
      projectSummary: summaryResult.summary,
      industry: testCase.industry,
    });

    const optimizedPromptResult = await generateOptimizedPrompt({
      industry: testCase.industry,
      projectSummary: summaryResult.summary,
      combinedFileTextContent: testCase.inputFiles.map(f => f.content),
      customizations: suggestionsResult.suggestions,
    });

    // Calculate scores
    const summaryScore = this.calculateSummaryScore(summaryResult.summary, testCase.expectedSummary);
    const suggestionsScore = this.calculateSuggestionsScore(suggestionsResult.suggestions, testCase.expectedSuggestions);
    const optimizedPromptScore = this.calculateOptimizedPromptScore(optimizedPromptResult.optimizedPrompt, testCase.expectedOptimizedPrompt);

    return {
      testCaseId,
      timestamp: Date.now(),
      summaryScore,
      suggestionsScore,
      optimizedPromptScore,
      overallScore: (summaryScore + suggestionsScore + optimizedPromptScore) / 3,
      summary: summaryResult.summary,
      optimizedPrompt: optimizedPromptResult.optimizedPrompt,
      suggestions: suggestionsResult.suggestions,
      details: {
        summary: this.evaluateSummary(summaryResult.summary, testCase.expectedSummary),
        suggestions: this.evaluateSuggestions(suggestionsResult.suggestions, testCase.expectedSuggestions),
        optimizedPrompt: this.evaluateOptimizedPrompt(optimizedPromptResult.optimizedPrompt, testCase.expectedOptimizedPrompt),
      },
    };
  }

  private calculateSummaryScore(summary: string, expected: ValidationTestCase['expectedSummary']): number {
    if (!summary) return 0;
    
    const keyPointsFound = expected.keyPoints.filter(point => 
      summary.toLowerCase().includes(point.toLowerCase())
    ).length;
    const requiredElementsFound = expected.requiredElements.filter(element =>
      summary.toLowerCase().includes(element.toLowerCase())
    ).length;

    return (
      (keyPointsFound / expected.keyPoints.length) * 0.6 +
      (requiredElementsFound / expected.requiredElements.length) * 0.4
    );
  }

  private calculateSuggestionsScore(suggestions: string[], expected: ValidationTestCase['expectedSuggestions']): number {
    if (!suggestions || suggestions.length === 0) return 0;

    const requiredTypesFound = expected.requiredTypes.filter(type =>
      suggestions.some(suggestion => suggestion.toLowerCase().includes(type.toLowerCase()))
    ).length;

    const countScore = suggestions.length >= expected.minCount && 
                      suggestions.length <= expected.maxCount ? 1 : 0;

    return (
      (requiredTypesFound / expected.requiredTypes.length) * 0.7 +
      countScore * 0.3
    );
  }

  private calculateOptimizedPromptScore(prompt: string, expected: ValidationTestCase['expectedOptimizedPrompt']): number {
    if (!prompt) return 0;

    const requiredElementsFound = expected.requiredElements.filter(element =>
      prompt.toLowerCase().includes(element.toLowerCase())
    ).length;

    const formatScore = this.validateFormat(prompt, expected.format) ? 1 : 0;
    const lengthScore = prompt.length <= expected.maxLength ? 1 : 0;

    return (
      (requiredElementsFound / expected.requiredElements.length) * 0.6 +
      formatScore * 0.2 +
      lengthScore * 0.2
    );
  }

  private validateFormat(prompt: string, format: 'markdown' | 'plain' | 'json'): boolean {
    if (!prompt) return false;
    
    switch (format) {
      case 'markdown':
        return /^#|^##|^###|^\-|^\*|^```/.test(prompt);
      case 'json':
        try {
          JSON.parse(prompt);
          return true;
        } catch {
          return false;
        }
      case 'plain':
        return !/^#|^##|^###|^\-|^\*|^```/.test(prompt);
      default:
        return false;
    }
  }

  private evaluateSummary(summary: string, expected: ValidationTestCase['expectedSummary']) {
    if (!summary) {
      return { accuracy: 0, completeness: 0, relevance: 0 };
    }
    
    return {
      accuracy: this.calculateSummaryScore(summary, expected),
      completeness: expected.keyPoints.filter(point => 
        summary.toLowerCase().includes(point.toLowerCase())
      ).length / expected.keyPoints.length,
      relevance: expected.requiredElements.filter(element =>
        summary.toLowerCase().includes(element.toLowerCase())
      ).length / expected.requiredElements.length,
    };
  }

  private evaluateSuggestions(suggestions: string[], expected: ValidationTestCase['expectedSuggestions']) {
    if (!suggestions || suggestions.length === 0) {
      return { relevance: 0, usefulness: 0, industryAlignment: 0 };
    }
    
    return {
      relevance: expected.requiredTypes.filter(type =>
        suggestions.some(suggestion => suggestion.toLowerCase().includes(type.toLowerCase()))
      ).length / expected.requiredTypes.length,
      usefulness: suggestions.length >= expected.minCount && 
                 suggestions.length <= expected.maxCount ? 1 : 0,
      industryAlignment: expected.requiredTypes.filter(type =>
        suggestions.some(suggestion => suggestion.toLowerCase().includes(type.toLowerCase()))
      ).length / expected.requiredTypes.length,
    };
  }

  private evaluateOptimizedPrompt(prompt: string, expected: ValidationTestCase['expectedOptimizedPrompt']) {
    if (!prompt) {
      return { clarity: 0, completeness: 0, formatCompliance: 0 };
    }
    
    return {
      clarity: expected.requiredElements.filter(element =>
        prompt.toLowerCase().includes(element.toLowerCase())
      ).length / expected.requiredElements.length,
      completeness: prompt.length <= expected.maxLength ? 1 : 0,
      formatCompliance: this.validateFormat(prompt, expected.format) ? 1 : 0,
    };
  }

  async validatePrompt(prompt: string, industry: string): Promise<ValidationResult> {
    const timestamp = Date.now();
    const testCaseId = `test-${timestamp}`;

    // Return a mock validation result based on the industry
    const baseResult: ValidationResult = {
      testCaseId,
      timestamp,
      summaryScore: 0.85,
      suggestionsScore: 0.8,
      optimizedPromptScore: 0.9,
      overallScore: 0.85,
      summary: 'Mock validation summary',
      optimizedPrompt: prompt,
      suggestions: [],
      details: {
        summary: {
          accuracy: 0.9,
          completeness: 0.85,
          relevance: 0.8
        },
        suggestions: {
          relevance: 0.85,
          usefulness: 0.8,
          industryAlignment: 0.9
        },
        optimizedPrompt: {
          clarity: 0.9,
          completeness: 0.85,
          formatCompliance: 0.95
        }
      }
    };

    // Add industry-specific mock data
    switch (industry.toLowerCase()) {
      case 'construction':
        return {
          ...baseResult,
          suggestions: ['Add safety requirements', 'Include timeline details'],
          summary: 'Construction project validation summary'
        };
      case 'healthcare':
        return {
          ...baseResult,
          suggestions: ['Add HIPAA compliance', 'Include patient privacy'],
          summary: 'Healthcare project validation summary'
        };
      case 'finance':
        return {
          ...baseResult,
          suggestions: ['Add regulatory compliance', 'Include risk assessment'],
          summary: 'Finance project validation summary'
        };
      default:
        return baseResult;
    }
  }

  async validateMultiplePrompts(prompts: string[], industry: string): Promise<ValidationResult[]> {
    return Promise.all(prompts.map(prompt => this.validatePrompt(prompt, industry)));
  }

  async handleRateLimit(): Promise<void> {
    // Mock rate limit handling
    return Promise.resolve();
  }
} 
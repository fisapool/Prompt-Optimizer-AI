import { ABTestConfig } from './types';

export const sampleABTest: ABTestConfig = {
  id: 'summarization-optimization-001',
  name: 'Summarization Optimization Test',
  description: 'Testing different summarization approaches for construction projects',
  variants: [
    {
      id: 'control',
      name: 'Control Group',
      config: {
        summarizationParams: {
          // Default parameters
        },
        suggestionParams: {
          // Default parameters
        },
        optimizationParams: {
          // Default parameters
        },
      },
    },
    {
      id: 'detailed-summary',
      name: 'Detailed Summary',
      config: {
        summarizationParams: {
          maxLength: 1000,
          includeDetails: true,
          focusOnRisks: true,
        },
        suggestionParams: {
          minSuggestions: 4,
          maxSuggestions: 6,
          focusOnCompliance: true,
        },
        optimizationParams: {
          format: 'markdown',
          includeExamples: true,
          maxLength: 600,
        },
      },
    },
    {
      id: 'concise-summary',
      name: 'Concise Summary',
      config: {
        summarizationParams: {
          maxLength: 500,
          includeDetails: false,
          focusOnKeyPoints: true,
        },
        suggestionParams: {
          minSuggestions: 2,
          maxSuggestions: 4,
          focusOnEfficiency: true,
        },
        optimizationParams: {
          format: 'plain',
          includeExamples: false,
          maxLength: 400,
        },
      },
    },
  ],
  metrics: {
    primary: [
      'summaryLength',
      'suggestionsCount',
      'optimizedPromptLength',
      'userRating',
    ],
    secondary: [
      'processingTime',
      'completionRate',
      'feedbackScore',
    ],
  },
}; 
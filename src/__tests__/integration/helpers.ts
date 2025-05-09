import { config, isIntegrationTest } from './config';
import { ValidationService } from '@/services/validation/validation-service';
import { ValidationTestCase } from '@/services/validation/types';
import fs from 'fs/promises';
import path from 'path';

// Helper to create a ValidationService instance with proper configuration
export const createValidationService = (): ValidationService => {
  if (!isIntegrationTest()) {
    throw new Error('This helper can only be used in integration tests');
  }
  return new ValidationService();
};

// Helper to load test data from fixtures
export const loadTestData = async (filename: string): Promise<string> => {
  const filePath = path.resolve(__dirname, '../fixtures', filename);
  return fs.readFile(filePath, 'utf-8');
};

// Helper to create a test case with real file content
export const createTestCaseWithFile = async (
  filename: string,
  industry: string = 'construction'
): Promise<ValidationTestCase> => {
  const content = await loadTestData(filename);
  return {
    id: `test-${Date.now()}`,
    name: `Test Case - ${filename}`,
    description: `Integration test case for ${filename}`,
    industry,
    inputFiles: [
      {
        name: filename,
        content,
        mimeType: 'text/plain',
      },
    ],
    expectedSummary: {
      keyPoints: [
        'Office Building',
        'Renovation',
        'LEED Gold',
        'Timeline',
        'Budget',
      ],
      requiredElements: [
        'Project Overview',
        'Requirements',
        'Timeline',
        'Budget',
        'Stakeholders',
      ],
    },
    expectedSuggestions: {
      requiredTypes: [
        'safety',
        'certification',
        'timeline',
        'budget',
        'stakeholder',
      ],
      minCount: 3,
      maxCount: 10,
    },
    expectedOptimizedPrompt: {
      requiredElements: [
        'Project Overview',
        'Requirements',
        'Timeline',
        'Budget',
        'Stakeholders',
      ],
      maxLength: 2000,
      format: 'markdown',
    },
  };
};

// Helper to wait for API rate limits
export const waitForRateLimit = async (ms: number = 1000): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

// Helper to validate API response
export const validateApiResponse = (response: any): void => {
  expect(response).toBeDefined();
  expect(response.status).toBe(200);
  expect(response.data).toBeDefined();
};

// Helper to handle API errors
export const handleApiError = (error: any): void => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('API Error Response:', {
      status: error.response.status,
      data: error.response.data,
    });
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Error Request:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Error:', error.message);
  }
  throw error;
}; 
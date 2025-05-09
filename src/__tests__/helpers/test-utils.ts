import { ValidationService } from '@/services/validation/validation-service';
import { sampleTestCase } from '@/services/validation/sample-test-case';

export const setupTestEnvironment = () => {
  const validationService = new ValidationService();
  return {
    validationService,
    sampleTestCase
  };
};

export const mockAIResponse = (response: string) => {
  // Mock fetch if it doesn't exist
  if (!global.fetch) {
    global.fetch = jest.fn();
  }
  
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ text: response }),
    } as Response)
  );
};

export const resetMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};

export const expectValidationResult = (result: any) => {
  expect(result).toBeDefined();
  expect(result.summaryScore).toBeGreaterThan(0);
  expect(result.suggestionsScore).toBeGreaterThan(0);
  expect(result.optimizedPromptScore).toBeGreaterThan(0);
  expect(result.overallScore).toBeGreaterThan(0);
}; 
import { ValidationService } from '../../../services/validation/validation-service';
import { createTestCaseWithFile } from '../helpers';
import { ValidationResult } from '../../../services/validation/types';
import { MockValidationService } from './__mocks__/ValidationService';

jest.mock('../../../services/validation/validation-service', () => ({
  ValidationService: jest.fn().mockImplementation(() => new MockValidationService())
}));

describe('Validation Service Integration', () => {
  let validationService: ValidationService;

  beforeAll(() => {
    validationService = new ValidationService();
  });

  describe('Real API Integration', () => {
    it('should process a real construction project file', async () => {
      const testCase = await createTestCaseWithFile('construction-project.txt', 'construction');
      await validationService.addTestCase(testCase);
      const result = await validationService.runValidation(testCase.id);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.suggestions).toHaveLength(5);
      expect(result.summary).toContain('Office Building Renovation project');
      expect(result.details.summary.accuracy).toBeGreaterThan(0);
    });

    it('should handle different industry types', async () => {
      const testCase = await createTestCaseWithFile('construction-project.txt', 'construction');
      await validationService.addTestCase(testCase);
      
      const result = await validationService.runValidation(testCase.id);
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.suggestions).toHaveLength(5);
      expect(result.optimizedPrompt).toContain('# Office Building Renovation Project Requirements');
    });

    it('should handle rate limiting gracefully', async () => {
      const testCase = await createTestCaseWithFile('construction-project.txt', 'construction');
      await validationService.addTestCase(testCase);
      
      // Test multiple cases in quick succession
      const promises = Array(5).fill(null).map(() => 
        validationService.runValidation(testCase.id)
      );
      
      const results = await Promise.all(promises);
      results.forEach((result: ValidationResult) => {
        expect(result).toBeDefined();
        expect(result.overallScore).toBeGreaterThan(0);
        expect(result.suggestions).toHaveLength(5);
      });
    });
  });
}); 
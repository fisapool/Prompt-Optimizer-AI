import { ValidationService } from '@/services/validation/validation-service';
import { createTestCaseWithFile } from '../../integration/helpers';
import { ValidationResult } from '@/services/validation/types';

describe('Validation Service Custom Matchers', () => {
  let validationService: ValidationService;

  beforeAll(() => {
    validationService = new ValidationService();
  });

  describe('Prompt Validation', () => {
    it('should validate healthcare prompts correctly', async () => {
      const testCase = await createTestCaseWithFile(
        'healthcare-project.txt',
        'healthcare'
      );
      
      await validationService.addTestCase(testCase);
      const result = await validationService.runValidation(testCase.id);

      // Test overall quality
      expect(result).toMeetQualityThreshold(0.85);

      // Test industry standards
      expect(result.optimizedPrompt).toMeetIndustryStandards('healthcare');

      // Test prompt validity
      expect(result.optimizedPrompt).toBeValidPrompt({
        minLength: 100,
        maxLength: 2000,
        requiredElements: ['Patient Care', 'HIPAA Compliance', 'Treatment Plan'],
        format: 'markdown'
      });

      // Test structure
      expect(result.summary).toHaveValidStructure({
        requiredSections: ['Medical History', 'Treatment Plan', 'Follow-up'],
        maxSectionLength: 1000,
        minSectionLength: 50
      });
    });

    it('should validate construction prompts correctly', async () => {
      const testCase = await createTestCaseWithFile(
        'construction-project.txt',
        'construction'
      );
      
      await validationService.addTestCase(testCase);
      const result = await validationService.runValidation(testCase.id);

      // Test overall quality
      expect(result).toMeetQualityThreshold(0.85);

      // Test industry standards
      expect(result.optimizedPrompt).toMeetIndustryStandards('construction');

      // Test prompt validity
      expect(result.optimizedPrompt).toBeValidPrompt({
        minLength: 100,
        maxLength: 2000,
        requiredElements: ['Safety', 'Permits', 'Timeline'],
        format: 'markdown'
      });

      // Test structure
      expect(result.summary).toHaveValidStructure({
        requiredSections: ['Project Scope', 'Safety Requirements', 'Timeline'],
        maxSectionLength: 1000,
        minSectionLength: 50
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      const testCase = await createTestCaseWithFile('invalid-project.txt');
      await validationService.addTestCase(testCase);
      
      const result = await validationService.runValidation(testCase.id);
      expect(result).toHandleErrorGracefully('invalid-input');
    });

    it('should handle rate limiting gracefully', async () => {
      const testCase = await createTestCaseWithFile('construction-project.txt');
      await validationService.addTestCase(testCase);
      
      // Simulate rate limiting
      jest.spyOn(validationService, 'runValidation')
        .mockRejectedValueOnce(new Error('Rate limit exceeded'));
      
      const result = await validationService.runValidation(testCase.id);
      expect(result).toHandleErrorGracefully('rate-limit');
    });
  });
}); 
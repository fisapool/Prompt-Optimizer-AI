import { ValidationService } from '@/services/validation/validation-service';
import { createTestCaseWithFile } from '../../integration/helpers';

describe('Validation Service Rules', () => {
  let validationService: ValidationService;

  beforeAll(() => {
    validationService = new ValidationService();
  });

  describe('Prompt Guidelines', () => {
    it('should validate prompt against guidelines', async () => {
      const testCase = await createTestCaseWithFile('healthcare-project.txt');
      await validationService.addTestCase(testCase);
      const result = await validationService.runValidation(testCase.id);

      const guidelines = [
        {
          pattern: /^#\s+Project Overview/i,
          message: 'Must start with Project Overview heading',
          severity: 'error' as const
        },
        {
          pattern: /##\s+Requirements/i,
          message: 'Must have Requirements section',
          severity: 'error' as const
        },
        {
          pattern: /##\s+Timeline/i,
          message: 'Must have Timeline section',
          severity: 'error' as const
        },
        {
          pattern: /Please provide/i,
          message: 'Should use "Please provide" instead of "You must"',
          severity: 'warning' as const
        }
      ];

      expect(result.optimizedPrompt).toFollowPromptGuidelines(guidelines);
    });
  });

  describe('Token Count', () => {
    it('should validate prompt token count', async () => {
      const testCase = await createTestCaseWithFile('construction-project.txt');
      await validationService.addTestCase(testCase);
      const result = await validationService.runValidation(testCase.id);

      // Maximum 1000 tokens
      expect(result.optimizedPrompt).toHaveValidTokenCount(1000);
    });
  });

  describe('Required Variables', () => {
    it('should validate required variables', async () => {
      const testCase = await createTestCaseWithFile('finance-project.txt');
      await validationService.addTestCase(testCase);
      const result = await validationService.runValidation(testCase.id);

      const requiredVariables = [
        'projectName',
        'budget',
        'timeline',
        'stakeholders'
      ];

      expect(result.optimizedPrompt).toContainRequiredVariables(requiredVariables);
    });
  });

  describe('Prompt Structure', () => {
    it('should validate prompt structure', async () => {
      const testCase = await createTestCaseWithFile('healthcare-project.txt');
      await validationService.addTestCase(testCase);
      const result = await validationService.runValidation(testCase.id);

      expect(result.optimizedPrompt).toHaveValidPromptStructure({
        sections: [
          'Project Overview',
          'Requirements',
          'Timeline',
          'Budget',
          'Stakeholders'
        ],
        order: [
          'Project Overview',
          'Requirements',
          'Timeline',
          'Budget',
          'Stakeholders'
        ],
        maxDepth: 3
      });
    });
  });

  describe('Combined Validation', () => {
    it('should validate all aspects of a healthcare prompt', async () => {
      const testCase = await createTestCaseWithFile('healthcare-project.txt');
      await validationService.addTestCase(testCase);
      const result = await validationService.runValidation(testCase.id);

      // Test overall quality
      expect(result).toMeetQualityThreshold(0.85);

      // Test industry standards
      expect(result.optimizedPrompt).toMeetIndustryStandards('healthcare');

      // Test prompt guidelines
      const guidelines = [
        {
          pattern: /^#\s+Project Overview/i,
          message: 'Must start with Project Overview heading',
          severity: 'error' as const
        },
        {
          pattern: /##\s+Requirements/i,
          message: 'Must have Requirements section',
          severity: 'error' as const
        }
      ];
      expect(result.optimizedPrompt).toFollowPromptGuidelines(guidelines);

      // Test token count
      expect(result.optimizedPrompt).toHaveValidTokenCount(1000);

      // Test required variables
      expect(result.optimizedPrompt).toContainRequiredVariables([
        'patientType',
        'treatmentPlan',
        'followUpSchedule'
      ]);

      // Test structure
      expect(result.optimizedPrompt).toHaveValidPromptStructure({
        sections: [
          'Project Overview',
          'Requirements',
          'Timeline',
          'Budget',
          'Stakeholders'
        ],
        order: [
          'Project Overview',
          'Requirements',
          'Timeline',
          'Budget',
          'Stakeholders'
        ],
        maxDepth: 3
      });
    });
  });
}); 
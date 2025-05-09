import { ValidationService } from '@/services/validation/validation-service';
import { sampleTestCase } from '@/services/validation/sample-test-case';
import { summarizeProjectData } from '@/ai/flows/summarize-project-data';
import { generatePromptSuggestions } from '@/ai/flows/generate-prompt-suggestions';
import { generateOptimizedPrompt } from '@/ai/flows/generate-optimized-prompt';

// Mock the AI flow functions
jest.mock('@/ai/flows/summarize-project-data');
jest.mock('@/ai/flows/generate-prompt-suggestions');
jest.mock('@/ai/flows/generate-optimized-prompt');

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
    jest.clearAllMocks();
  });

  describe('addTestCase', () => {
    it('should add a test case successfully', async () => {
      await validationService.addTestCase(sampleTestCase);
      // Verify the test case was added by running validation
      const mockSummary = {
        summary: 'Test summary containing LEED Gold certification and other key points',
      };
      const mockSuggestions = {
        suggestions: [
          'Include safety regulations',
          'Add compliance requirements',
          'Specify efficiency metrics',
        ],
      };
      const mockOptimizedPrompt = {
        optimizedPrompt: '# Project Requirements\n\n- LEED requirements\n- Safety regulations\n- Budget constraints',
      };

      (summarizeProjectData as jest.Mock).mockResolvedValue(mockSummary);
      (generatePromptSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (generateOptimizedPrompt as jest.Mock).mockResolvedValue(mockOptimizedPrompt);

      const result = await validationService.runValidation(sampleTestCase.id);
      expect(result.testCaseId).toBe(sampleTestCase.id);
    });
  });

  describe('runValidation', () => {
    beforeEach(() => {
      validationService.addTestCase(sampleTestCase);
    });

    it('should throw error for non-existent test case', async () => {
      await expect(validationService.runValidation('non-existent-id')).rejects.toThrow(
        'Test case non-existent-id not found'
      );
    });

    it('should calculate correct scores for valid input', async () => {
      const mockSummary = {
        summary: 'Test summary containing LEED Gold certification and other key points',
      };
      const mockSuggestions = {
        suggestions: [
          'Include safety regulations',
          'Add compliance requirements',
          'Specify efficiency metrics',
        ],
      };
      const mockOptimizedPrompt = {
        optimizedPrompt: '# Project Requirements\n\n- LEED requirements\n- Safety regulations\n- Budget constraints',
      };

      (summarizeProjectData as jest.Mock).mockResolvedValue(mockSummary);
      (generatePromptSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (generateOptimizedPrompt as jest.Mock).mockResolvedValue(mockOptimizedPrompt);

      const result = await validationService.runValidation(sampleTestCase.id);

      expect(result.summaryScore).toBeGreaterThan(0);
      expect(result.suggestionsScore).toBeGreaterThan(0);
      expect(result.optimizedPromptScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('should handle empty or invalid input files', async () => {
      const emptyTestCase = {
        ...sampleTestCase,
        id: 'empty-test',
        inputFiles: [],
      };
      await validationService.addTestCase(emptyTestCase);

      const mockSummary = {
        summary: 'No files were uploaded for summarization.',
      };
      const mockSuggestions = {
        suggestions: [],
      };
      const mockOptimizedPrompt = {
        optimizedPrompt: '# Empty Project\n\nNo data available.',
      };

      (summarizeProjectData as jest.Mock).mockResolvedValue(mockSummary);
      (generatePromptSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (generateOptimizedPrompt as jest.Mock).mockResolvedValue(mockOptimizedPrompt);

      const result = await validationService.runValidation(emptyTestCase.id);
      expect(result.summaryScore).toBe(0);
      expect(result.suggestionsScore).toBe(0);
      expect(result.optimizedPromptScore).toBeGreaterThan(0); // Should still pass format check
    });

    it('should handle AI service errors gracefully', async () => {
      (summarizeProjectData as jest.Mock).mockRejectedValue(new Error('AI service error'));

      await expect(validationService.runValidation(sampleTestCase.id)).rejects.toThrow(
        'AI service error'
      );
    });

    it('should validate format compliance correctly', async () => {
      const mockSummary = {
        summary: 'Test summary',
      };
      const mockSuggestions = {
        suggestions: ['Test suggestion'],
      };
      const mockOptimizedPrompt = {
        optimizedPrompt: 'Plain text without markdown formatting',
      };

      (summarizeProjectData as jest.Mock).mockResolvedValue(mockSummary);
      (generatePromptSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (generateOptimizedPrompt as jest.Mock).mockResolvedValue(mockOptimizedPrompt);

      const result = await validationService.runValidation(sampleTestCase.id);
      expect(result.optimizedPromptScore).toBeLessThan(1); // Should be lower due to format non-compliance
    });
  });
}); 
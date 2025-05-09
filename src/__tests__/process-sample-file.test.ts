import { ValidationService } from '@/services/validation/validation-service';
import { sampleTestCase } from '@/services/validation/sample-test-case';

// Mock the AI functions
const mockSummarizeProjectData = jest.fn().mockResolvedValue({
  summary: 'Mocked project summary'
});

const mockGeneratePromptSuggestions = jest.fn().mockResolvedValue({
  suggestions: ['Suggestion 1', 'Suggestion 2']
});

const mockGenerateOptimizedPrompt = jest.fn().mockResolvedValue({
  optimizedPrompt: 'Mocked optimized prompt'
});

// Mock the modules
jest.mock('@/ai/flows/summarize-project-data', () => ({
  summarizeProjectData: mockSummarizeProjectData
}));

jest.mock('@/ai/flows/generate-prompt-suggestions', () => ({
  generatePromptSuggestions: mockGeneratePromptSuggestions
}));

jest.mock('@/ai/flows/generate-optimized-prompt', () => ({
  generateOptimizedPrompt: mockGenerateOptimizedPrompt
}));

describe('Sample File Processing', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
    jest.clearAllMocks();
  });

  it('should process a sample construction project file through the entire pipeline', async () => {
    // Step 1: Add the test case
    await validationService.addTestCase(sampleTestCase);
    console.log('Step 1: Test case added successfully');

    // Step 2: Run the validation pipeline
    const result = await validationService.runValidation(sampleTestCase.id);
    console.log('\nStep 2: Validation Results');
    console.log('------------------------');
    console.log('Summary Score:', result.summaryScore);
    console.log('Suggestions Score:', result.suggestionsScore);
    console.log('Optimized Prompt Score:', result.optimizedPromptScore);
    console.log('Overall Score:', result.overallScore);

    // Verify the results
    expect(result.summaryScore).toBeGreaterThan(0);
    expect(result.suggestionsScore).toBeGreaterThan(0);
    expect(result.optimizedPromptScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeGreaterThan(0);

    // Verify that all mocked functions were called
    expect(mockSummarizeProjectData).toHaveBeenCalled();
    expect(mockGeneratePromptSuggestions).toHaveBeenCalled();
    expect(mockGenerateOptimizedPrompt).toHaveBeenCalled();
  });
}); 
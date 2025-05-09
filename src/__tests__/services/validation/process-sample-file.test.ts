import { ValidationService } from '@/services/validation/validation-service';
import { sampleTestCase } from '@/services/validation/sample-test-case';
import { summarizeProjectData } from '@/ai/flows/summarize-project-data';
import { generatePromptSuggestions } from '@/ai/flows/generate-prompt-suggestions';
import { generateOptimizedPrompt } from '@/ai/flows/generate-optimized-prompt';
import { setupTestEnvironment, mockAIResponse, resetMocks, expectValidationResult } from '../../helpers/test-utils';

// Mock the AI flow functions
jest.mock('@/ai/flows/summarize-project-data', () => ({
  summarizeProjectData: jest.fn()
}));
jest.mock('@/ai/flows/generate-prompt-suggestions', () => ({
  generatePromptSuggestions: jest.fn()
}));
jest.mock('@/ai/flows/generate-optimized-prompt', () => ({
  generateOptimizedPrompt: jest.fn()
}));

describe('Sample File Processing', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    resetMocks();
    const { validationService: service } = setupTestEnvironment();
    validationService = service;

    // Default successful mock responses
    (summarizeProjectData as jest.Mock).mockResolvedValue({
      summary: 'Project Summary:\n- Office Building Renovation\n- LEED Gold certification required\n- $2.5M budget\n- 6-month timeline\n- Multiple stakeholders involved\n- Several risk factors identified'
    });

    (generatePromptSuggestions as jest.Mock).mockResolvedValue({
      suggestions: [
        'Include detailed safety protocols',
        'Add specific LEED certification requirements',
        'Specify timeline milestones',
        'Detail budget allocation',
        'Include stakeholder communication plan'
      ]
    });

    (generateOptimizedPrompt as jest.Mock).mockResolvedValue({
      optimizedPrompt: `# Office Building Renovation Project Requirements

## Safety & Compliance
- Implement LEED Gold certification requirements
- Follow seismic retrofitting guidelines
- Ensure ADA compliance throughout
- Maintain historical building restrictions

## Timeline & Budget
- Complete within 6-month timeframe
- Stay within $2.5M budget
- Account for weather impacts
- Plan for supply chain delays

## Stakeholder Management
- Coordinate with ABC Corp (Building Owner)
- Work with XYZ Construction (General Contractor)
- Collaborate with Design Plus (Architect)
- Partner with Tech Solutions Inc (Engineering)

## Risk Mitigation
- Develop weather contingency plans
- Create supply chain backup strategies
- Establish tenant communication protocols
- Monitor historical preservation requirements`
    });

    mockAIResponse('Mocked AI response');
  });

  afterEach(() => {
    resetMocks();
  });

  describe('Basic Functionality', () => {
    it('should process a sample construction project file through the entire pipeline', async () => {
      // Step 1: Add test case
      await validationService.addTestCase(sampleTestCase);
      console.log('Step 1: Test case added successfully');

      // Step 2: Run validation
      const result = await validationService.runValidation(sampleTestCase.id);
      console.log('Step 2: Validation completed');
      expect(result).toBeDefined();
      expect(result.summaryScore).toBeGreaterThan(0);
      expect(result.suggestionsScore).toBeGreaterThan(0);
      expect(result.optimizedPromptScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThan(0);

      // Step 3: Summarize project data
      const summaryResult = await summarizeProjectData({
        files: sampleTestCase.inputFiles.map(f => ({
          fileDataUri: `data:${f.mimeType};base64,${Buffer.from(f.content).toString('base64')}`,
          fileName: f.name,
          mimeType: f.mimeType,
        })),
        industry: sampleTestCase.industry,
      });
      console.log('Step 3: Project data summarized');
      expect(summaryResult).toBeDefined();
      expect(summaryResult.summary).toBeDefined();

      // Step 4: Generate suggestions
      const suggestionsResult = await generatePromptSuggestions({
        combinedFileTextContent: sampleTestCase.inputFiles.map(f => f.content).join('\n'),
        projectSummary: summaryResult.summary,
        industry: sampleTestCase.industry,
      });
      console.log('Step 4: Suggestions generated');
      expect(suggestionsResult).toBeDefined();
      expect(suggestionsResult.suggestions).toBeDefined();

      // Step 5: Create optimized prompt
      const optimizedPromptResult = await generateOptimizedPrompt({
        industry: sampleTestCase.industry,
        projectSummary: summaryResult.summary,
        combinedFileTextContent: sampleTestCase.inputFiles.map(f => f.content).join('\n'),
        customizations: suggestionsResult.suggestions,
      });
      console.log('Step 5: Optimized prompt created');
      expect(optimizedPromptResult).toBeDefined();
      expect(optimizedPromptResult.optimizedPrompt).toBeDefined();

      // Verify all score metrics are greater than 0
      expect(result.summaryScore).toBeGreaterThan(0);
      expect(result.suggestionsScore).toBeGreaterThan(0);
      expect(result.optimizedPromptScore).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid test case ID gracefully', async () => {
      await validationService.addTestCase(sampleTestCase);
      await expect(validationService.runValidation('invalid-id')).rejects.toThrow('Test case invalid-id not found');
    });

    it('should handle AI service failures gracefully', async () => {
      (summarizeProjectData as jest.Mock).mockRejectedValue(new Error('AI service unavailable'));
      await validationService.addTestCase(sampleTestCase);
      await expect(validationService.runValidation(sampleTestCase.id)).rejects.toThrow('AI service unavailable');
    });

    it('should handle empty input files', async () => {
      const emptyTestCase = {
        ...sampleTestCase,
        inputFiles: []
      };

      await validationService.addTestCase(emptyTestCase);
      const result = await validationService.runValidation(emptyTestCase.id);
      
      expect(result).toBeDefined();
      expect(result.summaryScore).toBe(0);
      expect(result.suggestionsScore).toBe(0);
      expect(result.optimizedPromptScore).toBe(0);
      expect(result.overallScore).toBe(0);
    });

    it('should handle malformed file content', async () => {
      const malformedTestCase = {
        ...sampleTestCase,
        inputFiles: [{
          name: 'malformed.txt',
          content: Buffer.from('Invalid UTF-8 content').toString('base64'),
          mimeType: 'text/plain'
        }]
      };

      await validationService.addTestCase(malformedTestCase);
      const result = await validationService.runValidation(malformedTestCase.id);
      
      expect(result).toBeDefined();
      expect(result.summaryScore).toBeGreaterThanOrEqual(0);
      expect(result.suggestionsScore).toBeGreaterThanOrEqual(0);
      expect(result.optimizedPromptScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle rate limiting from AI service', async () => {
      (summarizeProjectData as jest.Mock).mockRejectedValue(new Error('RESOURCE_EXHAUSTED'));
      await validationService.addTestCase(sampleTestCase);
      await expect(validationService.runValidation(sampleTestCase.id)).rejects.toThrow('RESOURCE_EXHAUSTED');
    });
  });

  describe('Edge Cases', () => {
    it('should handle large file content', async () => {
      const largeContent = 'x'.repeat(1000000); // 1MB of content
      const largeTestCase = {
        ...sampleTestCase,
        inputFiles: [{
          name: 'large.txt',
          content: largeContent,
          mimeType: 'text/plain'
        }]
      };

      await validationService.addTestCase(largeTestCase);
      const result = await validationService.runValidation(largeTestCase.id);
      
      expect(result).toBeDefined();
      expect(result.summaryScore).toBeGreaterThanOrEqual(0);
      expect(result.suggestionsScore).toBeGreaterThanOrEqual(0);
      expect(result.optimizedPromptScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple file types', async () => {
      const multiFileTestCase = {
        ...sampleTestCase,
        inputFiles: [
          {
            name: 'text.txt',
            content: 'Text content',
            mimeType: 'text/plain'
          },
          {
            name: 'data.json',
            content: JSON.stringify({ key: 'value' }),
            mimeType: 'application/json'
          },
          {
            name: 'data.csv',
            content: 'header1,header2\nvalue1,value2',
            mimeType: 'text/csv'
          }
        ]
      };

      await validationService.addTestCase(multiFileTestCase);
      const result = await validationService.runValidation(multiFileTestCase.id);
      
      expect(result).toBeDefined();
      expect(result.summaryScore).toBeGreaterThanOrEqual(0);
      expect(result.suggestionsScore).toBeGreaterThanOrEqual(0);
      expect(result.optimizedPromptScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle special characters in content', async () => {
      const specialCharsTestCase = {
        ...sampleTestCase,
        inputFiles: [{
          name: 'special.txt',
          content: 'Special chars: é, ñ, 漢字, emoji: 😊, symbols: ©, ®, ™',
          mimeType: 'text/plain'
        }]
      };

      await validationService.addTestCase(specialCharsTestCase);
      const result = await validationService.runValidation(specialCharsTestCase.id);
      
      expect(result).toBeDefined();
      expect(result.summaryScore).toBeGreaterThanOrEqual(0);
      expect(result.suggestionsScore).toBeGreaterThanOrEqual(0);
      expect(result.optimizedPromptScore).toBeGreaterThanOrEqual(0);
    });
  });
});
import { ValidationService } from '../../services/validation/validation-service';
import { summarizeProjectData } from '../../ai/flows/summarize-project-data';
import { generatePromptSuggestions } from '../../ai/flows/generate-prompt-suggestions';
import { generateOptimizedPrompt } from '../../ai/flows/generate-optimized-prompt';
import { ValidationTestCase } from '../../services/validation/types';
import { testConfig } from '../../config/test-config';

// Mock the AI flows
jest.mock('../../ai/flows/summarize-project-data', () => ({
  summarizeProjectData: jest.fn().mockResolvedValue({
    summary: `Project Summary:
- Office Building Renovation project
- LEED Gold certification required
- $2.5M budget with 6-month timeline
- Multiple stakeholders involved
- Project Overview includes location and specifications
- Requirements cover LEED certification and structural updates
- Timeline details all project phases
- Budget breakdown provided
- Stakeholder list includes all key parties`,
  }),
}));

jest.mock('../../ai/flows/generate-prompt-suggestions', () => ({
  generatePromptSuggestions: jest.fn().mockResolvedValue({
    suggestions: [
      'Include detailed safety protocols for renovation work',
      'Add specific LEED Gold certification requirements and documentation',
      'Specify timeline milestones and dependencies',
      'Detail budget allocation and contingency plans',
      'Include stakeholder communication and coordination plan',
    ],
  }),
}));

jest.mock('../../ai/flows/generate-optimized-prompt', () => ({
  generateOptimizedPrompt: jest.fn().mockResolvedValue({
    optimizedPrompt: `# Office Building Renovation Project Requirements

## Project Overview
- Location: 123 Business Park, Suite 500
- Building Type: Commercial Office Space
- Total Area: 25,000 sq ft
- Current Condition: 15-year-old building

## Requirements
1. LEED Gold Certification
   - Energy efficiency improvements
   - Water conservation systems
   - Sustainable materials
   - Indoor air quality enhancements

## Timeline
- Duration: 6 months
- Key Phases:
  * Demolition
  * Structural work
  * Interior renovations
  * Systems installation
  * Final inspection

## Budget
- Total: $2.5M
- Includes contingency
- Detailed breakdown by category

## Stakeholder Management
- Building Owner coordination
- Contractor oversight
- Architect collaboration
- Engineering consultation`,
  }),
}));

describe('End-to-End Pipeline Tests', () => {
  let validationService: ValidationService;

  beforeAll(() => {
    // Verify test environment is properly configured
    expect(testConfig.isTest).toBe(true);
    expect(testConfig.gemini.apiKey).toBeDefined();
  });

  const sampleTestCase: ValidationTestCase = {
    id: 'test-case-1',
    industry: 'Construction',
    inputFiles: [
      {
        name: 'sample.txt',
        content: 'Sample project content for testing',
        mimeType: 'text/plain'
      }
    ],
    expectedSummary: {
      keyPoints: [
        'Project scope',
        'Timeline',
        'Budget',
        'Requirements'
      ],
      requiredElements: [
        'Project overview',
        'Key requirements',
        'Timeline',
        'Budget'
      ]
    },
    expectedSuggestions: {
      requiredTypes: [
        'safety',
        'compliance',
        'efficiency'
      ],
      minCount: 2,
      maxCount: 4
    },
    expectedOptimizedPrompt: {
      requiredElements: [
        'Project requirements',
        'Safety regulations',
        'Timeline constraints'
      ],
      maxLength: 500,
      format: 'markdown'
    }
  };

  beforeEach(() => {
    validationService = new ValidationService();
    jest.clearAllMocks();
  });

  describe('Basic Pipeline Flow', () => {
    it('should process a sample file through the entire pipeline', async () => {
      // Step 1: Add test case
      await validationService.addTestCase(sampleTestCase);
      console.log('Step 1: Test case added successfully');

      // Step 2: Run validation
      const result = await validationService.runValidation(sampleTestCase.id);
      console.log('Step 2: Validation completed');
      
      // Verify validation results
      expect(result).toBeDefined();
      expect(result.summaryScore).toBeGreaterThan(0);
      expect(result.suggestionsScore).toBeGreaterThan(0);
      expect(result.optimizedPromptScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThan(0);

      // Verify that all pipeline steps were called with proper configuration
      expect(summarizeProjectData).toHaveBeenCalledWith({
        files: expect.arrayContaining([
          expect.objectContaining({
            fileName: sampleTestCase.inputFiles[0].name,
            mimeType: sampleTestCase.inputFiles[0].mimeType
          })
        ]),
        industry: sampleTestCase.industry,
        apiKey: testConfig.gemini.apiKey
      });

      expect(generatePromptSuggestions).toHaveBeenCalledWith({
        combinedFileTextContent: expect.any(String),
        projectSummary: expect.any(String),
        industry: sampleTestCase.industry,
        apiKey: testConfig.gemini.apiKey
      });

      expect(generateOptimizedPrompt).toHaveBeenCalledWith({
        industry: sampleTestCase.industry,
        projectSummary: expect.any(String),
        combinedFileTextContent: expect.any(Array),
        customizations: expect.any(Array),
        apiKey: testConfig.gemini.apiKey
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing test case gracefully', async () => {
      await expect(validationService.runValidation('non-existent-id'))
        .rejects
        .toThrow('Test case non-existent-id not found');
    });

    it('should handle AI flow failures gracefully', async () => {
      await validationService.addTestCase(sampleTestCase);
      
      // Mock a failure in the summarize project data step
      (summarizeProjectData as jest.Mock).mockRejectedValue(new Error('AI service error'));

      await expect(validationService.runValidation(sampleTestCase.id))
        .rejects
        .toThrow('AI service error');
    });
  });

  describe('Pipeline Metrics', () => {
    it('should calculate accurate scores for perfect matches', async () => {
      await validationService.addTestCase(sampleTestCase);

      // Mock perfect matches
      (summarizeProjectData as jest.Mock).mockResolvedValue({
        summary: 'Project overview with key requirements, timeline, and budget details. Safety regulations and project requirements are outlined.'
      });

      (generatePromptSuggestions as jest.Mock).mockResolvedValue({
        suggestions: ['Safety protocols', 'Compliance requirements', 'Efficiency measures']
      });

      (generateOptimizedPrompt as jest.Mock).mockResolvedValue({
        optimizedPrompt: '# Project Requirements\n\n- Safety regulations\n- Timeline constraints\n- Project requirements'
      });

      const result = await validationService.runValidation(sampleTestCase.id);

      // Perfect matches should have high scores
      expect(result.summaryScore).toBeGreaterThan(0.9);
      expect(result.suggestionsScore).toBeGreaterThan(0.9);
      expect(result.optimizedPromptScore).toBeGreaterThan(0.9);
      expect(result.overallScore).toBeGreaterThan(0.9);
    });
  });
}); 
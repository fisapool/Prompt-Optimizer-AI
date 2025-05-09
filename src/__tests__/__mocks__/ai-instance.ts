// Mock the entire ai-instance.ts file
const mockAiInstance = {
  definePrompt: jest.fn().mockImplementation((config: any) => {
    return async (input: any) => ({
      output: {
        suggestions: [
          'Include detailed safety protocols',
          'Add specific certification requirements',
          'Specify timeline milestones',
        ],
        optimizedPrompt: `# ${input.industry} Project Requirements

## Project Overview
${input.projectSummary}

## Requirements
- Requirement 1
- Requirement 2
- Requirement 3

## Timeline
- Phase 1
- Phase 2
- Phase 3

## Customizations
${input.customizations?.join('\n')}`,
      },
    });
  }),
  defineFlow: jest.fn().mockImplementation((config: any, handler: (input: any) => Promise<any>) => {
    return async (input: any) => {
      return handler(input);
    };
  }),
  generate: jest.fn().mockResolvedValue('Mock generated content'),
};

// Export the mocked instance
export const ai = mockAiInstance;

// Mock the entire module
export default {
  ai: mockAiInstance,
}; 
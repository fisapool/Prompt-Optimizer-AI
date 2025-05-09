import { generatePromptSuggestions } from '@/ai/flows/generate-prompt-suggestions';
import { generateOptimizedPrompt } from '@/ai/flows/generate-optimized-prompt';

// Mock the AI instance
jest.mock('@/ai/ai-instance', () => ({
  ai: {
    definePrompt: jest.fn().mockImplementation(() => {
      return jest.fn().mockResolvedValue({
        output: {
          suggestions: ['Test suggestion 1', 'Test suggestion 2'],
          optimizedPrompt: 'Test optimized prompt'
        }
      });
    }),
    defineFlow: jest.fn().mockImplementation((config, handler) => handler)
  }
}));

describe('Prompt Generation Flow', () => {
  const testInput = {
    industry: 'Test Industry',
    projectSummary: 'Test project summary',
    combinedFileTextContent: 'Test content'
  };

  it('should generate prompt suggestions', async () => {
    const result = await generatePromptSuggestions(testInput);
    
    expect(result).toBeDefined();
    expect(result.suggestions).toEqual(['Test suggestion 1', 'Test suggestion 2']);
  });

  it('should generate optimized prompt', async () => {
    const result = await generateOptimizedPrompt({
      ...testInput,
      combinedFileTextContent: [testInput.combinedFileTextContent],
      customizations: ['Test customization']
    });
    
    expect(result).toBeDefined();
    expect(result.optimizedPrompt).toBe('Test optimized prompt');
  });
}); 
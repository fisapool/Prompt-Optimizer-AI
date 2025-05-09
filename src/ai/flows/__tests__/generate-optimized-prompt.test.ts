import { generateOptimizedPrompt } from '../generate-optimized-prompt';
import { jest } from '@jest/globals';
import { mocks } from '@/__tests__/integration/services/__mocks__/genkit';

jest.mock('genkit');

describe('generateOptimizedPrompt', () => {
  const mockInput = {
    industry: 'Technology',
    projectSummary: 'A test project summary',
    combinedFileTextContent: ['File 1 content', 'File 2 content'],
    customizations: ['Customization 1', 'Customization 2'],
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should generate an optimized prompt with valid input', async () => {
    const result = await generateOptimizedPrompt(mockInput);

    expect(result).toEqual({ optimizedPrompt: 'Generated optimized prompt content' });
    expect(mocks.definePrompt).toHaveBeenCalled();
    expect(mocks.defineFlow).toHaveBeenCalled();
    expect(mocks.execute).toHaveBeenCalledWith(mockInput);
  });

  it('should throw an error when AI returns no output', async () => {
    // Override the default mock for this test
    mocks.execute.mockResolvedValueOnce({ output: null });

    await expect(generateOptimizedPrompt(mockInput)).rejects.toThrow(
      'AI prompt generation returned no output.'
    );
  });

  it('should validate input schema', async () => {
    const invalidInput = {
      industry: 123, // Should be string
      projectSummary: 'A test project summary',
      combinedFileTextContent: 'Not an array', // Should be array
      customizations: ['Customization 1'],
    };

    await expect(generateOptimizedPrompt(invalidInput as any)).rejects.toThrow();
  });
}); 
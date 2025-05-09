export const summarizeProjectData = jest.fn().mockResolvedValue({
  summary: 'Mocked project summary'
});

export const generatePromptSuggestions = jest.fn().mockResolvedValue({
  suggestions: ['Suggestion 1', 'Suggestion 2']
});

export const generateOptimizedPrompt = jest.fn().mockResolvedValue({
  optimizedPrompt: 'Mocked optimized prompt'
}); 
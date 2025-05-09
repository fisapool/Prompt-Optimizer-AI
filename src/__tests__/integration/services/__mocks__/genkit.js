const mockGenkitInstance = {
  definePrompt: jest.fn().mockImplementation((config) => ({
    execute: jest.fn().mockResolvedValue({
      output: {
        suggestions: [
          'Include detailed safety protocols',
          'Add specific certification requirements',
          'Specify timeline milestones',
        ],
      },
    }),
  })),
  defineFlow: jest.fn().mockImplementation((config, handler) => async (input) => {
    return handler(input);
  }),
  generate: jest.fn().mockResolvedValue('Mock generated content'),
};

const genkit = jest.fn().mockImplementation((config) => {
  // Process plugins if they exist
  if (config.plugins) {
    config.plugins.forEach(plugin => {
      if (typeof plugin === 'function') {
        plugin(mockGenkitInstance);
      }
    });
  }
  return mockGenkitInstance;
});

module.exports = { genkit }; 
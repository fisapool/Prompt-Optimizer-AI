export const z = {
  object: () => ({
    shape: () => z,
    describe: () => z,
    array: () => z,
    string: () => z,
    number: () => z,
    boolean: () => z,
  }),
  string: () => ({
    describe: () => z.string(),
  }),
  array: () => ({
    describe: () => z.array(),
  }),
};

interface GenkitConfig {
  promptDir: string;
  plugins?: any[];
  model?: string;
}

interface GenkitPlugin {
  (instance: any): void;
}

const mockGenkitInstance = {
  definePrompt: jest.fn().mockImplementation((config: any) => ({
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
  defineFlow: jest.fn().mockImplementation((config: any, handler: (input: any) => Promise<any>) => async (input: any) => {
    return handler(input);
  }),
  generate: jest.fn().mockResolvedValue('Mock generated content'),
};

export const genkit = jest.fn().mockImplementation((config: GenkitConfig) => {
  // Process plugins if they exist
  if (config.plugins) {
    config.plugins.forEach((plugin: GenkitPlugin) => {
      if (typeof plugin === 'function') {
        plugin(mockGenkitInstance);
      }
    });
  }
  return mockGenkitInstance;
}); 
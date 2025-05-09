import { jest } from '@jest/globals';

const mockGenerateContent = jest.fn().mockResolvedValue({
  response: {
    candidates: [{
      content: {
        parts: [{
          text: 'Generated optimized prompt content'
        }]
      }
    }]
  }
});

export const GoogleGenerativeAI = jest.fn().mockImplementation(() => ({
  getGenerativeModel: jest.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  }),
}));

export const mocks = {
  generateContent: mockGenerateContent,
}; 
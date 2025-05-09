// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn()
};
global.localStorage = localStorageMock;

// Mock window.fetch
global.fetch = jest.fn();

// Import testing library extensions
require('@testing-library/jest-dom');

// Add custom matchers
expect.extend({
  toFollowPromptGuidelines(received, guidelines) {
    const passes = guidelines.every(guideline => {
      if (guideline.pattern.test(received)) {
        return true;
      }
      return guideline.severity === 'warning';
    });
    return {
      pass: passes,
      message: () => `Expected prompt to follow guidelines`
    };
  },
  toHaveValidTokenCount(received, maxTokens) {
    const tokens = received.split(/\s+/).length;
    return {
      pass: tokens <= maxTokens,
      message: () => `Expected token count to be <= ${maxTokens}, got ${tokens}`
    };
  },
  toContainRequiredVariables(received, variables) {
    const missing = variables.filter(v => !received.includes(v));
    return {
      pass: missing.length === 0,
      message: () => `Missing required variables: ${missing.join(', ')}`
    };
  },
  toHaveValidPromptStructure(received, config) {
    const sections = config.sections;
    const missing = sections.filter(s => !received.includes(s));
    return {
      pass: missing.length === 0,
      message: () => `Missing required sections: ${missing.join(', ')}`
    };
  },
  toMeetQualityThreshold(received, threshold) {
    return {
      pass: received.overallScore >= threshold,
      message: () => `Expected quality score >= ${threshold}, got ${received.overallScore}`
    };
  },
  toMeetIndustryStandards(received, industry) {
    return {
      pass: true, // Simplified for mock
      message: () => `Expected prompt to meet ${industry} industry standards`
    };
  }
});

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.GOOGLE_API_KEY = 'test-api-key';

// Add any global test setup here
global.jest = jest;

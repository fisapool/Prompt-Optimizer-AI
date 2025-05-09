import { ValidationResult } from '@/services/validation/types';

interface PromptOptions {
  minLength?: number;
  maxLength?: number;
  requiredElements?: string[];
  format?: 'markdown' | 'plain' | 'json';
}

interface ValidationRule {
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning';
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidPrompt(options?: PromptOptions): R;
      toMeetQualityThreshold(threshold?: number): R;
      toHaveValidStructure(structure: {
        requiredSections?: string[];
        optionalSections?: string[];
        maxSectionLength?: number;
        minSectionLength?: number;
      }): R;
      toHandleErrorGracefully(errorType: 'invalid-input' | 'rate-limit' | 'api-error'): R;
      toFollowPromptGuidelines(guidelines: ValidationRule[]): R;
      toHaveValidTokenCount(maxTokens: number): R;
      toContainRequiredVariables(variables: string[]): R;
      toHaveValidPromptStructure(structure: {
        sections: string[];
        order: string[];
        maxDepth?: number;
      }): R;
    }
  }
}

export const customMatchers = {
  toBeValidPrompt(received: string, options: PromptOptions = {}) {
    const {
      minLength = 50,
      maxLength = 2000,
      requiredElements = [],
      format = 'markdown'
    } = options;

    const lengthValid = received.length >= minLength && received.length <= maxLength;
    const elementsValid = requiredElements.every(element => 
      received.toLowerCase().includes(element.toLowerCase())
    );
    const formatValid = validateFormat(received, format);

    return {
      message: () => 
        `expected ${received} to be a valid prompt with length between ${minLength} and ${maxLength}, ` +
        `containing required elements: ${requiredElements.join(', ')}, and in ${format} format`,
      pass: lengthValid && elementsValid && formatValid
    };
  },

  toMeetQualityThreshold(received: ValidationResult, threshold = 0.8) {
    const {
      summaryScore,
      suggestionsScore,
      optimizedPromptScore,
      overallScore
    } = received;

    const scoresValid = 
      summaryScore >= threshold &&
      suggestionsScore >= threshold &&
      optimizedPromptScore >= threshold &&
      overallScore >= threshold;

    return {
      message: () =>
        `expected validation result to meet quality threshold of ${threshold}\n` +
        `Summary Score: ${summaryScore}\n` +
        `Suggestions Score: ${suggestionsScore}\n` +
        `Optimized Prompt Score: ${optimizedPromptScore}\n` +
        `Overall Score: ${overallScore}`,
      pass: scoresValid
    };
  },

  toHaveValidStructure(received: string, structure: {
    requiredSections?: string[];
    optionalSections?: string[];
    maxSectionLength?: number;
    minSectionLength?: number;
  }) {
    const {
      requiredSections = [],
      optionalSections = [],
      maxSectionLength = 1000,
      minSectionLength = 50
    } = structure;

    const sections = received.split(/\n\n/);
    const hasRequiredSections = requiredSections.every(section =>
      sections.some(s => s.toLowerCase().includes(section.toLowerCase()))
    );
    const hasValidLengths = sections.every(section =>
      section.length >= minSectionLength && section.length <= maxSectionLength
    );

    return {
      message: () =>
        `expected content to have valid structure\n` +
        `Required sections: ${requiredSections.join(', ')}\n` +
        `Optional sections: ${optionalSections.join(', ')}\n` +
        `Section length between ${minSectionLength} and ${maxSectionLength}`,
      pass: hasRequiredSections && hasValidLengths
    };
  },

  toHandleErrorGracefully(received: ValidationResult, errorType: 'invalid-input' | 'rate-limit' | 'api-error') {
    const errorHandlers = {
      'invalid-input': {
        expectedScore: 0,
        expectedMessage: 'Invalid input provided'
      },
      'rate-limit': {
        expectedScore: 0,
        expectedMessage: 'Rate limit exceeded'
      },
      'api-error': {
        expectedScore: 0,
        expectedMessage: 'API error occurred'
      }
    };

    const handler = errorHandlers[errorType];
    if (!handler) {
      return {
        message: () => `No error handler defined for type: ${errorType}`,
        pass: false
      };
    }

    const hasExpectedScore = received.overallScore === handler.expectedScore;
    const hasExpectedMessage = received.error?.message.includes(handler.expectedMessage);

    return {
      message: () =>
        `expected error handling for ${errorType}\n` +
        `Expected score: ${handler.expectedScore}\n` +
        `Expected message: ${handler.expectedMessage}`,
      pass: hasExpectedScore && hasExpectedMessage
    };
  },

  toFollowPromptGuidelines(received: string, guidelines: ValidationRule[]) {
    const violations = guidelines.filter(rule => !rule.pattern.test(received));
    const errors = violations.filter(v => v.severity === 'error');
    const warnings = violations.filter(v => v.severity === 'warning');

    return {
      message: () =>
        `expected prompt to follow all guidelines\n` +
        `Errors:\n${errors.map(e => `- ${e.message}`).join('\n')}\n` +
        `Warnings:\n${warnings.map(w => `- ${w.message}`).join('\n')}`,
      pass: errors.length === 0
    };
  },

  toHaveValidTokenCount(received: string, maxTokens: number) {
    // Simple token estimation (words + punctuation)
    const tokens = received.split(/\s+/).length;
    const isUnderLimit = tokens <= maxTokens;

    return {
      message: () =>
        `expected prompt to have ${maxTokens} or fewer tokens\n` +
        `Actual token count: ${tokens}`,
      pass: isUnderLimit
    };
  },

  toContainRequiredVariables(received: string, variables: string[]) {
    const missingVars = variables.filter(variable => 
      !received.includes(`{${variable}}`) && 
      !received.includes(`{{${variable}}}`)
    );

    return {
      message: () =>
        `expected prompt to contain all required variables\n` +
        `Missing variables: ${missingVars.join(', ')}`,
      pass: missingVars.length === 0
    };
  },

  toHaveValidPromptStructure(received: string, structure: {
    sections: string[];
    order: string[];
    maxDepth?: number;
  }) {
    const { sections, order, maxDepth = 3 } = structure;
    
    // Check if all required sections exist
    const missingSections = sections.filter(section =>
      !received.toLowerCase().includes(section.toLowerCase())
    );

    // Check section order
    const sectionIndices = order.map(section => 
      received.toLowerCase().indexOf(section.toLowerCase())
    );
    const isOrdered = sectionIndices.every((index, i) => 
      i === 0 || index > sectionIndices[i - 1]
    );

    // Check heading depth
    const headingDepth = Math.max(
      ...received.match(/^#{1,6}/gm)?.map(h => h.length) || [0]
    );
    const hasValidDepth = headingDepth <= maxDepth;

    return {
      message: () =>
        `expected prompt to have valid structure\n` +
        `Missing sections: ${missingSections.join(', ')}\n` +
        `Section order: ${isOrdered ? 'valid' : 'invalid'}\n` +
        `Heading depth: ${headingDepth} (max: ${maxDepth})`,
      pass: missingSections.length === 0 && isOrdered && hasValidDepth
    };
  }
};

// Helper function to validate format
function validateFormat(content: string, format: 'markdown' | 'plain' | 'json'): boolean {
  if (!content) return false;
  
  switch (format) {
    case 'markdown':
      return /^#|^##|^###|^\-|^\*|^```/.test(content);
    case 'json':
      try {
        JSON.parse(content);
        return true;
      } catch {
        return false;
      }
    case 'plain':
      return !/^#|^##|^###|^\-|^\*|^```/.test(content);
    default:
      return false;
  }
} 
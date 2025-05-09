import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Verify required environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required for tests');
}

// Set test timeout to 30 seconds for AI API calls
jest.setTimeout(30000);

// Mock console.error to avoid noise in test output
const originalError = console.error;
console.error = (...args: any[]) => {
  if (args[0]?.includes('Warning: ReactDOM.render is no longer supported')) {
    return;
  }
  originalError.call(console, ...args);
};

// Set up environment variables for testing
// Note: We don't modify NODE_ENV as it's read-only
process.env.TEST_TYPE = 'integration';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock API responses
jest.mock('@/ai/flows/summarize-project-data', () => ({
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

jest.mock('@/ai/flows/generate-prompt-suggestions', () => ({
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

jest.mock('@/ai/flows/generate-optimized-prompt', () => ({
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
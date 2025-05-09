import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface IntegrationConfig {
  apiKeys: {
    gemini: string;
    google: string;
  };
  services: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  testData: {
    sampleFiles: string[];
    industries: string[];
  };
}

// Validate required environment variables
const requiredEnvVars = ['GEMINI_API_KEY', 'GOOGLE_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

// Only enforce this check if not in a test environment
if (missingEnvVars.length > 0 && process.env.NODE_ENV !== 'test') {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export const config: IntegrationConfig = {
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY || '',
    google: process.env.GOOGLE_API_KEY || '',
  },
  services: {
    baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
    timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS || '3', 10),
  },
  testData: {
    sampleFiles: [
      'construction-project.txt',
      'healthcare-project.txt',
      'finance-project.txt'
    ],
    industries: [
      'construction',
      'healthcare',
      'finance'
    ],
  },
};

// Helper function to check if we're running in integration test mode
export const isIntegrationTest = (): boolean => {
  return process.env.NODE_ENV === 'test' && process.env.TEST_TYPE === 'integration';
};

// Helper function to get test data path
export const getTestDataPath = (filename: string): string => {
  return path.join(process.cwd(), 'src', '__tests__', 'fixtures', filename);
};
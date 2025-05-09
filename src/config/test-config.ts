import { config } from './environment';

export const testConfig = {
  ...config,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'test-api-key',
  },
  environment: 'test',
  isDevelopment: false,
  isTest: true,
  isProduction: false,
} as const;

export default testConfig; 
import { config } from '../../config/environment';
import { testConfig } from '../../config/test-config';

describe('Environment Configuration', () => {
  it('should load environment variables correctly', () => {
    // Verify that the API key is loaded
    expect(config.gemini.apiKey).toBeDefined();
    expect(config.gemini.apiKey).toBe(process.env.GEMINI_API_KEY);
    
    // Verify environment settings
    expect(config.environment).toBeDefined();
    expect(['development', 'test', 'production']).toContain(config.environment);
  });

  it('should have test configuration properly set', () => {
    // Verify test configuration
    expect(testConfig.isTest).toBe(true);
    expect(testConfig.isDevelopment).toBe(false);
    expect(testConfig.isProduction).toBe(false);
    
    // Verify API key is available in test config
    expect(testConfig.gemini.apiKey).toBeDefined();
  });
}); 
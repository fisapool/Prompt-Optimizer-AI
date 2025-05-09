import { AIService } from '../../services/ai/ai-service';
import { CodeQualityMetrics, SecurityAnalysis, PerformanceInsights } from '../../services/analysis/text-extraction-service';
import { 
  sampleCodes,
  sampleMetrics,
  sampleSecurityAnalysis,
  samplePerformanceAnalysis,
  mockAIResponses
} from '../helpers/ai-service-test-helpers';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    // Set up environment variable for testing
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test_key';
    aiService = new AIService();
  });

  describe('Connection Test', () => {
    it('should successfully connect to Gemini AI', async () => {
      const isConnected = await aiService.testConnection();
      expect(isConnected).toBe(true);
    });

    it('should handle connection failure gracefully', async () => {
      // Temporarily remove API key to simulate failure
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = '';
      
      await expect(async () => {
        new AIService();
      }).rejects.toThrow('GEMINI_API_KEY environment variable is required');

      // Restore API key
      process.env.GEMINI_API_KEY = originalKey;
    });
  });

  describe('Code Analysis', () => {
    beforeEach(async () => {
      // Ensure we have a connection before running tests
      const isConnected = await aiService.testConnection();
      if (!isConnected) {
        console.warn('Warning: Could not connect to Gemini AI. Tests may fail.');
      }
    });

    it('should analyze a simple React component', async () => {
      const code = sampleCodes.react;

      const result = await aiService.analyzeCode(code);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Check for React-specific analysis
      const lowerResult = result.toLowerCase();
      expect(lowerResult).toContain('react');
      expect(lowerResult).toContain('usestate');
    });

    it('should analyze TypeScript code', async () => {
      const code = sampleCodes.typescript;

      const result = await aiService.analyzeCode(code);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      const lowerResult = result.toLowerCase();
      expect(lowerResult).toContain('typescript');
      expect(lowerResult).toContain('interface');
      expect(lowerResult).toContain('class');
    });

    it('should handle empty code input', async () => {
      await expect(aiService.analyzeCode('')).rejects.toThrow();
    });
  });

  describe('Code Quality Metrics', () => {
    it('should enhance code quality metrics', async () => {
      const metrics = {
        ...sampleMetrics,
        code: 'function example() { return true; }',
        aiInsights: 'Sample insights' // Ensure aiInsights is provided as it's required
      };

      const result = await aiService.enhanceCodeQualityMetrics(metrics);
      expect(result).toBeDefined();
      expect(result.cyclomaticComplexity).toBeDefined();
      expect(result.maintainabilityIndex).toBeDefined();
      expect(result.codeDuplication).toBeDefined();
      expect(result.testCoverage).toBeDefined();
    });

    it('should handle invalid metrics input', async () => {
      const invalidMetrics = {
        cyclomaticComplexity: -1,
        maintainabilityIndex: -1,
        codeDuplication: 150,
        testCoverage: -10,
        code: '',
        aiInsights: 'Invalid metrics test' // Provide a valid aiInsights value
      };

      await expect(aiService.enhanceCodeQualityMetrics(invalidMetrics)).rejects.toThrow();
    });
  });

  describe('Security Analysis', () => {
    it('should detect security vulnerabilities', async () => {
      const code = sampleCodes.vulnerableCode;

      const result = await aiService.analyzeSecurity(code);
      expect(result).toBeDefined();
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
      expect(Array.isArray(result.bestPractices)).toBe(true);
      
      // Should detect SQL injection vulnerability
      expect(result.vulnerabilities.some(v => 
        v.toLowerCase().includes('sql injection'))).toBe(true);
    });

    it('should analyze secure code correctly', async () => {
      const code = sampleCodes.secureCode;

      const result = await aiService.analyzeSecurity(code);
      expect(result.vulnerabilities.length).toBe(0);
      expect(result.bestPractices.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Analysis', () => {
    it('should identify performance bottlenecks', async () => {
      const code = sampleCodes.inefficientCode;

      const result = await aiService.analyzePerformance(code);
      expect(result).toBeDefined();
      expect(Array.isArray(result.bottlenecks)).toBe(true);
      expect(Array.isArray(result.optimizationSuggestions)).toBe(true);

      // Should detect recursive performance issue
      expect(result.bottlenecks.some(b => 
        b.toLowerCase().includes('recursive'))).toBe(true);
    });

    it('should analyze optimized code correctly', async () => {
      const code = sampleCodes.optimizedCode;

      const result = await aiService.analyzePerformance(code);
      expect(result.bottlenecks.length).toBeLessThan(2);
      expect(result.optimizationSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate actionable recommendations', async () => {
      const analysis = {
        codeQuality: sampleMetrics,
        security: sampleSecurityAnalysis,
        performance: samplePerformanceAnalysis,
        code: 'function example() { return true; }',
        aiInsights: mockAIResponses.codeAnalysis
      };

      const recommendations = await aiService.generateRecommendations(analysis);
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Verify recommendations are strings and not empty
      recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network error by providing invalid API key
      process.env.GEMINI_API_KEY = 'invalid_key';
      const tempService = new AIService();
      
      await expect(tempService.analyzeCode('console.log("test")')).rejects.toThrow();
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = Array(10).fill(null).map(() => 
        aiService.analyzeCode('console.log("test")')
      );
      
      await expect(Promise.all(promises)).rejects.toThrow();
    });

    it('should handle timeout', async () => {
      // Provide a large code sample to potentially trigger timeout
      const largeCode = 'console.log("test");\n'.repeat(1000);
      
      await expect(aiService.analyzeCode(largeCode)).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should perform full analysis pipeline', async () => {
      const code = sampleCodes.vulnerableCode;

      // Step 1: Code Analysis
      const analysis = await aiService.analyzeCode(code);
      expect(analysis).toBeDefined();

      // Step 2: Security Analysis
      const security = await aiService.analyzeSecurity(code);
      expect(security.vulnerabilities.length).toBeGreaterThan(0);

      // Step 3: Performance Analysis
      const performance = await aiService.analyzePerformance(code);
      expect(performance.bottlenecks.length).toBeGreaterThan(0);

      // Step 4: Generate Recommendations
      const recommendations = await aiService.generateRecommendations({
        codeQuality: sampleMetrics,
        security,
        performance,
        code,
        aiInsights: analysis
      });

      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});

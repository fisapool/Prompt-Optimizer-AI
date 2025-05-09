import { GoogleGenerativeAI } from '@google/generative-ai';
import { CodeQualityMetrics, SecurityAnalysis, PerformanceInsights } from '../analysis/text-extraction-service';

export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // Initialize with API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use the latest model version
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Gemini AI connection...');
      const result = await this.model.generateContent('Hello, World!');
      console.log('Received response from Gemini AI:', result);
      const response = await result.response;
      const text = response.text();
      console.log('Response text:', text);
      return text.length > 0;
    } catch (error) {
      console.error('Failed to connect to Gemini AI:', error);
      return false;
    }
  }

  async analyzeCode(code: string): Promise<any> {
    try {
      console.log('Analyzing code with Gemini AI...');
      console.log('Code to analyze:', code);
      const prompt = `Analyze the following code and provide insights about its structure, patterns, and potential improvements:

${code}

Provide a detailed analysis focusing on:
1. Code structure and organization
2. Design patterns used
3. Potential architectural improvements
4. Code smells or anti-patterns
5. Best practices that could be applied`;

      console.log('Sending prompt to Gemini AI:', prompt);
      const result = await this.model.generateContent(prompt);
      console.log('Received result from Gemini AI:', result);
      const response = await result.response;
      const text = response.text();
      console.log('Analysis response:', text);
      return text;
    } catch (error) {
      console.error('Error analyzing code:', error);
      throw error;
    }
  }

  async enhanceCodeQualityMetrics(metrics: {
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    codeDuplication: number;
    testCoverage: number;
    code: string;
    aiInsights: any;
  }): Promise<CodeQualityMetrics> {
    const prompt = `Given the following code quality metrics and code, provide enhanced analysis and suggestions:

Metrics:
- Cyclomatic Complexity: ${metrics.cyclomaticComplexity}
- Maintainability Index: ${metrics.maintainabilityIndex}
- Code Duplication: ${metrics.codeDuplication}%
- Test Coverage: ${metrics.testCoverage}%

Code:
${metrics.code}

AI Insights:
${metrics.aiInsights}

Provide enhanced metrics and specific suggestions for improvement.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const enhancedMetrics = this.parseAIResponse(response.text());
    return {
      ...metrics,
      ...enhancedMetrics
    };
  }

  async analyzeSecurity(code: string): Promise<{
    vulnerabilities: string[];
    bestPractices: string[];
  }> {
    const prompt = `Analyze the following code for security vulnerabilities and best practices:

${code}

Focus on:
1. Common security vulnerabilities
2. Input validation and sanitization
3. Data protection
4. Authentication and authorization
5. Secure coding practices`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return this.parseSecurityAnalysis(response.text());
  }

  async analyzePerformance(code: string): Promise<{
    bottlenecks: string[];
    optimizationSuggestions: string[];
  }> {
    const prompt = `Analyze the following code for performance issues and optimization opportunities:

${code}

Focus on:
1. Algorithmic complexity
2. Memory usage
3. CPU utilization
4. Network requests
5. Resource management
6. Caching opportunities`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return this.parsePerformanceAnalysis(response.text());
  }

  async generateRecommendations(analysis: {
    codeQuality: CodeQualityMetrics;
    security: SecurityAnalysis;
    performance: PerformanceInsights;
    code: string;
    aiInsights: any;
  }): Promise<string[]> {
    const prompt = `Based on the following analysis, generate specific, actionable recommendations:

Code Quality:
${JSON.stringify(analysis.codeQuality, null, 2)}

Security Analysis:
${JSON.stringify(analysis.security, null, 2)}

Performance Analysis:
${JSON.stringify(analysis.performance, null, 2)}

Code:
${analysis.code}

AI Insights:
${analysis.aiInsights}

Provide specific, actionable recommendations for improvement.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return this.parseRecommendations(response.text());
  }

  private parseAIResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      return {};
    }
  }

  private parseSecurityAnalysis(response: string): {
    vulnerabilities: string[];
    bestPractices: string[];
  } {
    const vulnerabilities: string[] = [];
    const bestPractices: string[] = [];

    const lines = response.split('\n');
    let currentCategory = '';

    for (const line of lines) {
      if (line.toLowerCase().includes('vulnerability')) {
        currentCategory = 'vulnerability';
      } else if (line.toLowerCase().includes('best practice')) {
        currentCategory = 'bestPractice';
      } else if (line.trim() && currentCategory) {
        if (currentCategory === 'vulnerability') {
          vulnerabilities.push(line.trim());
        } else {
          bestPractices.push(line.trim());
        }
      }
    }

    return { vulnerabilities, bestPractices };
  }

  private parsePerformanceAnalysis(response: string): {
    bottlenecks: string[];
    optimizationSuggestions: string[];
  } {
    const bottlenecks: string[] = [];
    const optimizationSuggestions: string[] = [];

    const lines = response.split('\n');
    let currentCategory = '';

    for (const line of lines) {
      if (line.toLowerCase().includes('bottleneck')) {
        currentCategory = 'bottleneck';
      } else if (line.toLowerCase().includes('optimization')) {
        currentCategory = 'optimization';
      } else if (line.trim() && currentCategory) {
        if (currentCategory === 'bottleneck') {
          bottlenecks.push(line.trim());
        } else {
          optimizationSuggestions.push(line.trim());
        }
      }
    }

    return { bottlenecks, optimizationSuggestions };
  }

  private parseRecommendations(response: string): string[] {
    return response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('-') && !line.startsWith('*'))
      .map(line => line.replace(/^\d+\.\s*/, ''));
  }
} 
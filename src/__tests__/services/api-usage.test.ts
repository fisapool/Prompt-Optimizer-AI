import { ApiUsageService } from '../../services/api-usage';

describe('ApiUsageService', () => {
  let service: ApiUsageService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset the singleton instance
    (ApiUsageService as any).instance = undefined;
    service = ApiUsageService.getInstance();
  });

  it('should track requests correctly', async () => {
    await service.trackRequest('test-endpoint', 100, 0.1);
    const metrics = service.getUsageMetrics();

    expect(metrics.totalRequests).toBe(1);
    expect(metrics.totalTokens).toBe(100);
    expect(metrics.cost).toBe(0.1);
    expect(metrics.requestsByEndpoint['test-endpoint']).toBe(1);
  });

  it('should track errors correctly', async () => {
    await service.trackError();
    const metrics = service.getUsageMetrics();

    expect(metrics.errors).toBe(1);
  });

  it('should check limits correctly', () => {
    const limits = service.getUsageLimits();
    expect(limits.maxRequestsPerDay).toBe(1000);
    expect(limits.maxTokensPerDay).toBe(1000000);
    expect(limits.maxCostPerDay).toBe(10);
  });

  it('should calculate remaining quota correctly', () => {
    const remaining = service.getRemainingQuota();
    expect(remaining.requests).toBe(1000);
    expect(remaining.tokens).toBe(1000000);
    expect(remaining.cost).toBe(10);
  });

  it('should detect when limits are exceeded', async () => {
    // Exceed the request limit
    for (let i = 0; i < 1001; i++) {
      await service.trackRequest('test-endpoint', 100, 0.1);
    }

    expect(service.isLimitExceeded()).toBe(true);
  });

  it('should track hourly usage', async () => {
    await service.trackRequest('test-endpoint', 100, 0.1);
    const hourlyUsage = service.getHourlyUsage();
    
    expect(hourlyUsage.length).toBeGreaterThan(0);
    expect(hourlyUsage[0].requests).toBe(1);
    expect(hourlyUsage[0].tokens).toBe(100);
    expect(hourlyUsage[0].cost).toBe(0.1);
  });

  it('should calculate usage trends', () => {
    const trends = service.getUsageTrends();
    expect(trends).toHaveProperty('requestsPerHour');
    expect(trends).toHaveProperty('tokensPerHour');
    expect(trends).toHaveProperty('costPerHour');
    expect(trends).toHaveProperty('errorRate');
  });

  it('should get usage distribution', () => {
    const distribution = service.getUsageDistribution();
    expect(distribution).toHaveProperty('endpointDistribution');
    expect(distribution).toHaveProperty('errorDistribution');
  });

  it('should persist metrics in localStorage', async () => {
    await service.trackRequest('test-endpoint', 100, 0.1);
    const stored = localStorage.getItem('gemini_api_usage');
    expect(stored).not.toBeNull();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.metrics.totalRequests).toBe(1);
    expect(parsed.metrics.totalTokens).toBe(100);
    expect(parsed.metrics.cost).toBe(0.1);
  });

  it('should reset metrics for a new day', async () => {
    // Set last used date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    localStorage.setItem('gemini_api_usage', JSON.stringify({
      metrics: {
        totalRequests: 100,
        totalTokens: 1000,
        cost: 1,
        lastUsed: yesterday.toISOString(),
        requestsByEndpoint: {},
        errors: 0,
        hourlyUsage: {},
        alerts: {
          requestsThreshold: 0,
          tokensThreshold: 0,
          costThreshold: 0,
          alertThreshold: 0.8
        }
      },
      timestamp: yesterday.toISOString()
    }));

    // Get a new instance which should reset the metrics
    const newService = ApiUsageService.getInstance();
    const metrics = newService.getUsageMetrics();

    expect(metrics.totalRequests).toBe(0);
    expect(metrics.totalTokens).toBe(0);
    expect(metrics.cost).toBe(0);
  });
});

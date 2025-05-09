interface ApiUsageMetrics {
  totalRequests: number;
  totalTokens: number;
  cost: number;
  lastUsed: Date;
  requestsByEndpoint: Record<string, number>;
  errors: number;
  hourlyUsage: {
    [hour: string]: {
      requests: number;
      tokens: number;
      cost: number;
      errors: number;
    };
  };
  alerts: {
    requestsThreshold: number;
    tokensThreshold: number;
    costThreshold: number;
  };
}

interface ApiUsageLimit {
  maxRequestsPerDay: number;
  maxTokensPerDay: number;
  maxCostPerDay: number;
}

export class ApiUsageService {
  private static instance: ApiUsageService;
  private metrics: ApiUsageMetrics;
  private limits: ApiUsageLimit;
  private readonly STORAGE_KEY = 'gemini_api_usage';
  private readonly ALERT_THRESHOLD = 0.8; // 80% of limit

  private constructor() {
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      cost: 0,
      lastUsed: new Date(),
      requestsByEndpoint: {},
      errors: 0,
      hourlyUsage: {},
      alerts: {
        requestsThreshold: 0,
        tokensThreshold: 0,
        costThreshold: 0
      }
    };
    
    this.limits = {
      maxRequestsPerDay: 1000,
      maxTokensPerDay: 1000000,
      maxCostPerDay: 10 // in USD
    };
    
    this.loadMetrics();
    this.updateAlertThresholds();
  }

  static getInstance(): ApiUsageService {
    if (!ApiUsageService.instance) {
      ApiUsageService.instance = new ApiUsageService();
    }
    return ApiUsageService.instance;
  }

  private loadMetrics(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const { metrics, timestamp } = JSON.parse(stored);
        // Reset metrics if it's a new day
        if (this.isNewDay(new Date(timestamp))) {
          this.resetMetrics();
        } else {
          this.metrics = metrics;
        }
      }
    } catch (error) {
      console.error('Failed to load API usage metrics:', error);
      this.resetMetrics();
    }
  }

  private saveMetrics(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save API usage metrics:', error);
    }
  }

  private isNewDay(date: Date): boolean {
    const today = new Date();
    return date.getDate() !== today.getDate() ||
           date.getMonth() !== today.getMonth() ||
           date.getFullYear() !== today.getFullYear();
  }

  private resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      cost: 0,
      lastUsed: new Date(),
      requestsByEndpoint: {},
      errors: 0,
      hourlyUsage: {},
      alerts: {
        requestsThreshold: 0,
        tokensThreshold: 0,
        costThreshold: 0
      }
    };
    this.saveMetrics();
  }

  private updateAlertThresholds(): void {
    this.metrics.alerts = {
      requestsThreshold: this.limits.maxRequestsPerDay * this.ALERT_THRESHOLD,
      tokensThreshold: this.limits.maxTokensPerDay * this.ALERT_THRESHOLD,
      costThreshold: this.limits.maxCostPerDay * this.ALERT_THRESHOLD
    };
  }

  private getCurrentHour(): string {
    const now = new Date();
    return now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  }

  private updateHourlyMetrics(tokens: number, cost: number): void {
    const hour = this.getCurrentHour();
    if (!this.metrics.hourlyUsage[hour]) {
      this.metrics.hourlyUsage[hour] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        errors: 0
      };
    }
    
    this.metrics.hourlyUsage[hour].requests++;
    this.metrics.hourlyUsage[hour].tokens += tokens;
    this.metrics.hourlyUsage[hour].cost += cost;
  }

  async trackRequest(endpoint: string, tokens: number, cost: number): Promise<void> {
    this.metrics.totalRequests++;
    this.metrics.totalTokens += tokens;
    this.metrics.cost += cost;
    this.metrics.lastUsed = new Date();
    this.metrics.requestsByEndpoint[endpoint] = (this.metrics.requestsByEndpoint[endpoint] || 0) + 1;
    this.updateHourlyMetrics(tokens, cost);
    this.saveMetrics();
  }

  async trackError(): Promise<void> {
    this.metrics.errors++;
    const hour = this.getCurrentHour();
    if (this.metrics.hourlyUsage[hour]) {
      this.metrics.hourlyUsage[hour].errors++;
    }
    this.saveMetrics();
  }

  getHourlyUsage(): Array<{
    hour: string;
    requests: number;
    tokens: number;
    cost: number;
    errors: number;
  }> {
    return Object.entries(this.metrics.hourlyUsage)
      .map(([hour, data]) => ({
        hour,
        ...data
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  getUsageTrends(): {
    requestsPerHour: number;
    tokensPerHour: number;
    costPerHour: number;
    errorRate: number;
  } {
    const hourlyData = this.getHourlyUsage();
    const totalHours = hourlyData.length || 1;

    return {
      requestsPerHour: this.metrics.totalRequests / totalHours,
      tokensPerHour: this.metrics.totalTokens / totalHours,
      costPerHour: this.metrics.cost / totalHours,
      errorRate: this.metrics.errors / this.metrics.totalRequests
    };
  }

  shouldAlert(): {
    requests: boolean;
    tokens: boolean;
    cost: boolean;
  } {
    return {
      requests: this.metrics.totalRequests >= this.metrics.alerts.requestsThreshold,
      tokens: this.metrics.totalTokens >= this.metrics.alerts.tokensThreshold,
      cost: this.metrics.cost >= this.metrics.alerts.costThreshold
    };
  }

  getUsageMetrics(): ApiUsageMetrics {
    return { ...this.metrics };
  }

  getUsageLimits(): ApiUsageLimit {
    return { ...this.limits };
  }

  isLimitExceeded(): boolean {
    return (
      this.metrics.totalRequests >= this.limits.maxRequestsPerDay ||
      this.metrics.totalTokens >= this.limits.maxTokensPerDay ||
      this.metrics.cost >= this.limits.maxCostPerDay
    );
  }

  getRemainingQuota(): {
    requests: number;
    tokens: number;
    cost: number;
  } {
    return {
      requests: Math.max(0, this.limits.maxRequestsPerDay - this.metrics.totalRequests),
      tokens: Math.max(0, this.limits.maxTokensPerDay - this.metrics.totalTokens),
      cost: Math.max(0, this.limits.maxCostPerDay - this.metrics.cost)
    };
  }

  getUsageDistribution(): {
    endpointDistribution: Array<{ endpoint: string; percentage: number }>;
    errorDistribution: Array<{ hour: string; percentage: number }>;
  } {
    const totalRequests = this.metrics.totalRequests;
    const totalErrors = this.metrics.errors;

    const endpointDistribution = Object.entries(this.metrics.requestsByEndpoint)
      .map(([endpoint, count]) => ({
        endpoint,
        percentage: (count / totalRequests) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const errorDistribution = this.getHourlyUsage()
      .map(entry => ({
        hour: entry.hour,
        percentage: (entry.errors / totalErrors) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      endpointDistribution,
      errorDistribution
    };
  }
} 
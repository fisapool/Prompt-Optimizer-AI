import { ApiUsageService } from '@/services/api-usage';

interface ExportOptions {
  format: 'csv' | 'json';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export async function exportUsageData(options: ExportOptions): Promise<string> {
  const service = ApiUsageService.getInstance();
  const data = await prepareExportData(service, options);
  
  if (options.format === 'csv') {
    return convertToCSV(data);
  } else {
    return JSON.stringify(data, null, 2);
  }
}

async function prepareExportData(service: ApiUsageService, options: ExportOptions) {
  const { dateRange } = options;
  const hourlyData = service.getHourlyUsage();
  const metrics = service.getUsageMetrics();
  const limits = service.getUsageLimits();
  const trends = service.getUsageTrends();
  
  let filteredData = hourlyData;
  if (dateRange) {
    filteredData = hourlyData.filter(entry => {
      const entryDate = new Date(entry.hour);
      return entryDate >= dateRange.start && entryDate <= dateRange.end;
    });
  }

  return {
    summary: {
      totalRequests: metrics.totalRequests,
      totalTokens: metrics.totalTokens,
      totalCost: metrics.cost,
      errorRate: metrics.errors / metrics.totalRequests,
      dateRange: dateRange ? {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      } : undefined
    },
    hourlyData: filteredData,
    endpointUsage: metrics.requestsByEndpoint,
    limits,
    trends
  };
}

function convertToCSV(data: any): string {
  const headers = ['Hour', 'Requests', 'Tokens', 'Cost', 'Errors'];
  const rows = data.hourlyData.map((entry: any) => [
    entry.hour,
    entry.requests,
    entry.tokens,
    entry.cost,
    entry.errors
  ]);

  return [
    headers.join(','),
    ...rows.map((row: any[]) => row.join(','))
  ].join('\n');
} 
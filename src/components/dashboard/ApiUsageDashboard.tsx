import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiUsageService } from '@/services/api-usage';
import { exportUsageData } from '@/utils/export-usage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function formatHour(hour: string): string {
  return new Date(hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface DistributionData {
  endpointDistribution: Array<{ endpoint: string; percentage: number }>;
  errorDistribution: Array<{ hour: string; percentage: number }>;
}

export function ApiUsageDashboard() {
  const [metrics, setMetrics] = useState(ApiUsageService.getInstance().getUsageMetrics());
  const [limits, setLimits] = useState(ApiUsageService.getInstance().getUsageLimits());
  const [remaining, setRemaining] = useState(ApiUsageService.getInstance().getRemainingQuota());
  const [hourlyData, setHourlyData] = useState(ApiUsageService.getInstance().getHourlyUsage());
  const [trends, setTrends] = useState(ApiUsageService.getInstance().getUsageTrends());
  const [alerts, setAlerts] = useState(ApiUsageService.getInstance().shouldAlert());
  const [distribution, setDistribution] = useState<DistributionData>(ApiUsageService.getInstance().getUsageDistribution());

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(ApiUsageService.getInstance().getUsageMetrics());
      setLimits(ApiUsageService.getInstance().getUsageLimits());
      setRemaining(ApiUsageService.getInstance().getRemainingQuota());
      setHourlyData(ApiUsageService.getInstance().getHourlyUsage());
      setTrends(ApiUsageService.getInstance().getUsageTrends());
      setAlerts(ApiUsageService.getInstance().shouldAlert());
      setDistribution(ApiUsageService.getInstance().getUsageDistribution());
    };

    // Update metrics every minute
    const interval = setInterval(updateMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const data = await exportUsageData({ format });
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-usage-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export usage data:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Export Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => handleExport('csv')}>
          Export CSV
        </Button>
        <Button variant="outline" onClick={() => handleExport('json')}>
          Export JSON
        </Button>
      </div>

      {/* Alerts */}
      {(alerts.requests || alerts.tokens || alerts.cost) && (
        <Alert variant="destructive">
          <AlertDescription>
            {alerts.requests && "Approaching daily request limit. "}
            {alerts.tokens && "Approaching daily token limit. "}
            {alerts.cost && "Approaching daily cost limit."}
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Requests Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Requests</span>
                <span className="text-sm text-muted-foreground">
                  {formatNumber(metrics.totalRequests)} / {formatNumber(limits.maxRequestsPerDay)}
                </span>
              </div>
              <Progress 
                value={(metrics.totalRequests / limits.maxRequestsPerDay) * 100} 
                className="h-2"
              />
            </div>

            {/* Tokens Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Tokens</span>
                <span className="text-sm text-muted-foreground">
                  {formatNumber(metrics.totalTokens)} / {formatNumber(limits.maxTokensPerDay)}
                </span>
              </div>
              <Progress 
                value={(metrics.totalTokens / limits.maxTokensPerDay) * 100} 
                className="h-2"
              />
            </div>

            {/* Cost Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Cost</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(metrics.cost)} / {formatCurrency(limits.maxCostPerDay)}
                </span>
              </div>
              <Progress 
                value={(metrics.cost / limits.maxCostPerDay) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Distribution */}
      <div className="grid grid-cols-2 gap-4">
        {/* Endpoint Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution.endpointDistribution}
                    dataKey="percentage"
                    nameKey="endpoint"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {distribution.endpointDistribution.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Error Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Error Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution.errorDistribution}
                    dataKey="percentage"
                    nameKey="hour"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${formatHour(name)} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {distribution.errorDistribution.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={formatHour}
                  tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)}
                  labelFormatter={formatHour}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#8884d8" 
                  name="Requests"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#82ca9d" 
                  name="Tokens"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Average Usage per Hour</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requests</span>
                  <span>{formatNumber(Math.round(trends.requestsPerHour))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tokens</span>
                  <span>{formatNumber(Math.round(trends.tokensPerHour))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <span>{formatCurrency(trends.costPerHour)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Error Rate</h4>
              <div className="text-2xl font-bold">
                {(trends.errorRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage by Endpoint */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(metrics.requestsByEndpoint).map(([endpoint, count]) => (
              <div key={endpoint} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{endpoint}</span>
                <span>{formatNumber(count)} requests</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
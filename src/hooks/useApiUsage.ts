import { useState, useEffect } from 'react';
import { ApiUsageService } from '@/services/api-usage';

export function useApiUsage() {
  const [metrics, setMetrics] = useState(ApiUsageService.getInstance().getUsageMetrics());
  const [remaining, setRemaining] = useState(ApiUsageService.getInstance().getRemainingQuota());

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(ApiUsageService.getInstance().getUsageMetrics());
      setRemaining(ApiUsageService.getInstance().getRemainingQuota());
    };

    const interval = setInterval(updateMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    remaining,
    isLimitExceeded: ApiUsageService.getInstance().isLimitExceeded(),
    trackRequest: ApiUsageService.getInstance().trackRequest.bind(ApiUsageService.getInstance()),
    trackError: ApiUsageService.getInstance().trackError.bind(ApiUsageService.getInstance())
  };
} 
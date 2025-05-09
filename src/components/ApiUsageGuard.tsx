import { useEffect, useState } from 'react';
import { ApiUsageService } from '@/services/api-usage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ApiUsageGuardProps {
  children: React.ReactNode;
}

export function ApiUsageGuard({ children }: ApiUsageGuardProps) {
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkLimit = () => {
      const exceeded = ApiUsageService.getInstance().isLimitExceeded();
      setIsLimitExceeded(exceeded);
      
      if (exceeded) {
        toast({
          title: "API Usage Limit Reached",
          description: "You've reached your daily API usage limit. Please try again tomorrow.",
          variant: "destructive",
        });
      }
    };

    checkLimit();
    const interval = setInterval(checkLimit, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [toast]);

  if (isLimitExceeded) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You've reached your daily API usage limit. Please try again tomorrow.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
} 
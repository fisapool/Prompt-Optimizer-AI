"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Loader2, Circle } from "lucide-react";

export interface ProgressStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress: number;
}

interface ProgressTrackerProps {
  stages: ProgressStage[];
  currentStage: string;
  onStageClick?: (stageId: string) => void;
}

const getStageIcon = (status: ProgressStage['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500 transition-colors duration-200" />;
    case 'in-progress':
      return (
        <div className="relative">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin transition-all duration-300" />
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
        </div>
      );
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500 transition-colors duration-200" />;
    default:
      return <Circle className="h-5 w-5 text-gray-400 transition-colors duration-200" />;
  }
};

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  stages,
  currentStage,
  onStageClick
}) => {
  return (
    <div className="space-y-4" role="progressbar" aria-label="Progress tracker">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className={cn(
            "flex items-center space-x-4 p-4 rounded-lg transition-colors",
            stage.id === currentStage && "bg-muted/50",
            onStageClick && "cursor-pointer hover:bg-muted/30"
          )}
          onClick={() => onStageClick?.(stage.id)}
          role="button"
          tabIndex={onStageClick ? 0 : -1}
          aria-label={`${stage.name} - ${stage.status}`}
          data-testid="stage-container"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            {getStageIcon(stage.status)}
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-medium">{stage.name}</span>
              <span className="text-sm text-muted-foreground">
                {stage.progress}%
              </span>
            </div>
            <Progress 
              value={stage.progress} 
              className="mt-2 transition-all duration-500 ease-in-out"
              aria-label={`Progress for ${stage.name}`}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {stage.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

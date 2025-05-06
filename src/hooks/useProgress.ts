import { useState, useCallback } from 'react';
import { ProgressStage } from '@/components/ProgressTracker';
import { PROGRESS_STAGES } from '@/constants/progress-stages';

export function useProgress() {
  const [stages, setStages] = useState<ProgressStage[]>(PROGRESS_STAGES);
  const [currentStage, setCurrentStage] = useState<string>(PROGRESS_STAGES[0].id);

  const updateStage = useCallback((stageId: string, updates: Partial<ProgressStage>) => {
    setStages(prevStages => 
      prevStages.map(stage => 
        stage.id === stageId 
          ? { ...stage, ...updates }
          : stage
      )
    );
  }, []);

  const setStageStatus = useCallback((stageId: string, status: ProgressStage['status']) => {
    updateStage(stageId, { status });
  }, [updateStage]);

  const setStageProgress = useCallback((stageId: string, progress: number) => {
    updateStage(stageId, { progress });
  }, [updateStage]);

  const moveToNextStage = useCallback(() => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentIndex < stages.length - 1) {
      setCurrentStage(stages[currentIndex + 1].id);
    }
  }, [currentStage, stages]);

  const resetProgress = useCallback(() => {
    setStages(PROGRESS_STAGES);
    setCurrentStage(PROGRESS_STAGES[0].id);
  }, []);

  return {
    stages,
    currentStage,
    setCurrentStage,
    updateStage,
    setStageStatus,
    setStageProgress,
    moveToNextStage,
    resetProgress
  };
} 
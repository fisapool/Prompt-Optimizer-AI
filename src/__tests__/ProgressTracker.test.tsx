import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressTracker } from '../components/ProgressTracker';

describe('ProgressTracker', () => {
  const mockStages = [
    {
      id: 'stage1',
      name: 'Stage 1',
      description: 'First stage',
      status: 'completed' as const,
      progress: 100
    },
    {
      id: 'stage2',
      name: 'Stage 2',
      description: 'Second stage',
      status: 'in-progress' as const,
      progress: 50
    },
    {
      id: 'stage3',
      name: 'Stage 3',
      description: 'Third stage',
      status: 'pending' as const,
      progress: 0
    }
  ];

  it('renders all stages', () => {
    render(<ProgressTracker stages={mockStages} currentStage="stage2" />);
    
    mockStages.forEach(stage => {
      expect(screen.getByText(stage.name)).toBeInTheDocument();
      expect(screen.getByText(stage.description)).toBeInTheDocument();
    });
  });

  it('shows correct progress for each stage', () => {
    render(<ProgressTracker stages={mockStages} currentStage="stage2" />);
    
    mockStages.forEach(stage => {
      const progressElement = screen.getByText(`${stage.progress}%`);
      expect(progressElement).toBeInTheDocument();
    });
  });

  it('highlights current stage', () => {
    render(<ProgressTracker stages={mockStages} currentStage="stage2" />);
    
    const currentStage = screen.getByText('Stage 2').closest('[data-testid="stage-container"]');
    expect(currentStage).toHaveClass('bg-muted/50');
  });

  it('calls onStageClick when a stage is clicked', () => {
    let clickedStageId: string | undefined;
    const handleStageClick = (stageId: string) => {
      clickedStageId = stageId;
    };

    render(
      <ProgressTracker 
        stages={mockStages} 
        currentStage="stage2" 
        onStageClick={handleStageClick}
      />
    );
    
    screen.getByText('Stage 1').click();
    expect(clickedStageId).toBe('stage1');
  });
}); 
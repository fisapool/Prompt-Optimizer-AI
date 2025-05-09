import { generateOptimizedPrompt, GenerateOptimizedPromptInput } from '@/ai/flows/generate-optimized-prompt';

describe('generateOptimizedPrompt', () => {
  it('should generate a markdown prompt with all required sections', async () => {
    const input: GenerateOptimizedPromptInput = {
      industry: 'Healthcare',
      projectSummary: 'Upgrade hospital IT infrastructure for better patient data management.',
      combinedFileTextContent: [
        'Install new EHR system.',
        'Ensure HIPAA compliance.',
        'Train staff on new software.'
      ],
      customizations: [
        'Include cybersecurity best practices',
        'Add telemedicine support',
        'Integrate with existing pharmacy system'
      ]
    };

    const { optimizedPrompt } = await generateOptimizedPrompt(input);

    expect(optimizedPrompt).toContain('# Healthcare Project Requirements');
    expect(optimizedPrompt).toContain('Upgrade hospital IT infrastructure');
    expect(optimizedPrompt).toContain('Include cybersecurity best practices');
    expect(optimizedPrompt).toContain('Add telemedicine support');
    expect(optimizedPrompt).toContain('Integrate with existing pharmacy system');
    expect(optimizedPrompt).toContain('Install new EHR system.');
    expect(optimizedPrompt).toContain('Ensure HIPAA compliance.');
    expect(optimizedPrompt).toContain('Train staff on new software.');
    expect(optimizedPrompt).toMatch(/^# Healthcare Project Requirements/);
    expect(optimizedPrompt.length).toBeLessThanOrEqual(1000);
  });

  it('should handle empty customizations and file content gracefully', async () => {
    const input: GenerateOptimizedPromptInput = {
      industry: 'Finance',
      projectSummary: 'Implement new budgeting software.',
      combinedFileTextContent: [],
      customizations: []
    };
    const { optimizedPrompt } = await generateOptimizedPrompt(input);
    expect(optimizedPrompt).toContain('# Finance Project Requirements');
    expect(optimizedPrompt).toContain('Implement new budgeting software.');
  });
});
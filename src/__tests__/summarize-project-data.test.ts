import { describe, it, expect } from '@jest/globals';
import { summarizeProjectData } from '../ai/flows/summarize-project-data';
import fs from 'fs';
import path from 'path';

// Mock the AI model
jest.mock('@/ai/ai-instance', () => ({
  ai: {
    definePrompt: () => () => ({
      output: {
        summary: 'Test summary containing task details, budget information, and meeting notes.'
      }
    }),
    defineFlow: () => () => ({
      summary: 'Test summary containing task details, budget information, and meeting notes.'
    })
  }
}));

describe('summarizeProjectData', () => {
  it('should summarize the data files', async () => {
    // Create a path that goes from the test file, traverses back to the root, and then goes into the test files directory
    const taskListContent = fs.readFileSync(path.join(__dirname, '..', '..', '__test__', 'test_files', 'task_list_test.csv'), 'utf-8');
    const budgetOverviewContent = fs.readFileSync(path.join(__dirname, '..', '..', '__test__', 'test_files', 'budget_overview_test.csv'), 'utf-8');
    const meetingNotesContent = fs.readFileSync(path.join(__dirname, '..', '..', '__test__', 'test_files', 'meeting_notes_test.txt'), 'utf-8');

    // Convert content to data URIs
    const taskListDataUri = `data:text/csv;base64,${Buffer.from(taskListContent).toString('base64')}`;
    const budgetDataUri = `data:text/csv;base64,${Buffer.from(budgetOverviewContent).toString('base64')}`;
    const meetingNotesDataUri = `data:text/plain;base64,${Buffer.from(meetingNotesContent).toString('base64')}`;

    const input = {
      files: [
        {
          fileDataUri: taskListDataUri,
          fileName: 'task_list_test.csv',
          mimeType: 'text/csv'
        },
        {
          fileDataUri: budgetDataUri,
          fileName: 'budget_overview_test.csv',
          mimeType: 'text/csv'
        },
        {
          fileDataUri: meetingNotesDataUri,
          fileName: 'meeting_notes_test.txt',
          mimeType: 'text/plain'
        }
      ],
      industry: 'Software Development'
    };

    const result = await summarizeProjectData(input);
    
    // Basic assertions
    expect(result.summary).toBeDefined();
    expect(result.summary).toContain('task');
    expect(result.summary).toContain('budget');
    expect(result.summary).toContain('meeting');
  });

  it('should handle empty file list', async () => {
    const input = {
      files: [],
      industry: 'Software Development'
    };

    const result = await summarizeProjectData(input);
    expect(result.summary).toBe('No files were uploaded for summarization.');
  });
}); 
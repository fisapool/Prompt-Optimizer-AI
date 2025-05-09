import { ProgressStage } from "@/components/ProgressTracker";

export const PROGRESS_STAGES: ProgressStage[] = [
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'Processing uploaded files',
    status: 'pending',
    progress: 0
  },
  {
    id: 'text-extraction',
    name: 'Text Extraction',
    description: 'Extracting text from files',
    status: 'pending',
    progress: 0
  },
  {
    id: 'ai-analysis',
    name: 'AI Analysis',
    description: 'Analyzing content with AI',
    status: 'pending',
    progress: 0
  },
  {
    id: 'prompt-generation',
    name: 'Prompt Generation',
    description: 'Generating optimized prompt',
    status: 'pending',
    progress: 0
  }
];

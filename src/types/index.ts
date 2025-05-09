import { Industry } from "@/components/IndustrySelector";
import { Message } from "@/components/ChatInterface";
import { ProgressStage } from "@/components/ProgressTracker";

export interface FileWithPreview extends File {
  preview?: string;
}

export interface ProjectState {
  selectedIndustry: Industry | null;
  uploadedFiles: FileList | null;
  fileContents: string[];
  projectSummary: string;
  promptSuggestions: string[];
  promptCustomizations: string[];
  optimizedPrompt: string | null;
  messages: Message[];
  stages: ProgressStage[];
  currentStage: string;
  isLoading: boolean;
  isLoadingSuggestions: boolean;
}

export interface ProjectAction {
  type: string;
  payload?: any;
}

export interface ProjectContextType {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
}

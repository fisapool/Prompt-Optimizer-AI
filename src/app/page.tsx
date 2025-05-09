// src/app/page.tsx
'use client';

import type * as React from 'react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { summarizeProjectData, type SummarizeProjectDataInput } from '@/ai/flows/summarize-project-data';
import { generatePromptSuggestions, type GeneratePromptSuggestionsInput } from '@/ai/flows/generate-prompt-suggestions';
import { generateOptimizedPrompt, type GenerateOptimizedPromptInput } from '@/ai/flows/generate-optimized-prompt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import IndustrySelector, { type Industry } from '@/components/IndustrySelector';
import FileUpload from '@/components/FileUpload';
import { ChatInterface, type Message } from '@/components/ChatInterface';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Loader2, Wand2, Copy, Check, ThumbsUp, ThumbsDown, Code, Trash2 } from "lucide-react";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ProgressTracker } from '@/components/ProgressTracker';
import { useProgress } from '@/hooks/useProgress';
import { errorHandler } from '@/services/error-handling';
import { QuestionSet } from '@/components/QuestionSet';
import { QuestionGenerator, type Question } from '@/ai/services/questionGenerator';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Define structure for uploaded file state
interface UploadedFile {
  name: string;
  dataUri: string;
  mimeType: string;
  textContent?: string; // Store extracted text content
}

type PromptFeedback = 'like' | 'dislike' | null;

export default function Home() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [projectSummary, setProjectSummary] = useState<string | null>(null);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]); // State for customization suggestions
  const [customizationMessages, setCustomizationMessages] = useState<Message[]>([]); // Messages for customization chat display
  const [promptCustomizations, setPromptCustomizations] = useState<string[]>([]); // Actual customization text strings
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null); // State for the final generated prompt
  const [isLoadingChatInput, setIsLoadingChatInput] = useState(false); // Separate loading for chat input interaction (not actual AI call here)
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isGeneratingFinalPrompt, setIsGeneratingFinalPrompt] = useState(false); // State for final prompt generation loading
  const [error, setError] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [isCopied, setIsCopied] = useState(false); // State for copy button feedback
  const [promptFeedback, setPromptFeedback] = useState<PromptFeedback>(null); // State for prompt feedback
  const { toast } = useToast(); // Initialize toast
  const {
    stages,
    currentStage,
    setStageStatus,
    setStageProgress,
    moveToNextStage
  } = useProgress();
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const questionGenerator = useMemo(() => new QuestionGenerator(), []);
  const [expectedOutput, setExpectedOutput] = useState<string | null>(null);

  // Add state for client-side rendering
  const [isClient, setIsClient] = useState(false);

  // Initialize localStorage state with default values
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [savedSettings, setSavedSettings] = useState<{
    uploadedFiles: UploadedFile[];
    selectedIndustry: Industry | null;
    projectSummary: string | null;
    promptSuggestions: string[];
    expectedOutput: string | null;
    chatHistory: Message[];
  }>({
    uploadedFiles: [],
    selectedIndustry: null,
    projectSummary: null,
    promptSuggestions: [],
    expectedOutput: null,
    chatHistory: []
  });

  // Add state for upload progress and status
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isLoadingPrompt = isSummarizing || isGeneratingSuggestions || isGeneratingFinalPrompt;

  // Handle client-side initialization
  useEffect(() => {
    setIsClient(true);
    
    // Load saved settings from localStorage
    const loadSavedSettings = () => {
      try {
        const savedChatHistory = localStorage.getItem('chatHistory');
        const savedSettingsData = localStorage.getItem('savedSettings');
        
        if (savedChatHistory) {
          setChatHistory(JSON.parse(savedChatHistory));
        }
        
        if (savedSettingsData) {
          const parsedSettings = JSON.parse(savedSettingsData);
          setSavedSettings(parsedSettings);
          
          // Update other state based on saved settings
          if (parsedSettings.projectSummary) {
            setProjectSummary(parsedSettings.projectSummary);
          }
          if (parsedSettings.promptSuggestions.length > 0) {
            setPromptSuggestions(parsedSettings.promptSuggestions);
          }
          if (parsedSettings.expectedOutput) {
            setExpectedOutput(parsedSettings.expectedOutput);
          }
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    };

    loadSavedSettings();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        localStorage.setItem('savedSettings', JSON.stringify(savedSettings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  }, [chatHistory, savedSettings, isClient]);

  // Helper function to extract text content from a Data URI
  const extractTextFromDataUri = useCallback((dataUri: string, mimeType: string): { success: boolean; content: string } => {
      const match = dataUri.match(/^data:(.+?);base64,(.+)$/);
      if (!match) {
        return { success: false, content: `Invalid data URI format (MIME type: ${mimeType || 'unknown'}).` };
      }
      const actualMimeType = match[1] || mimeType;
      const base64Data = match[2];

      try {
        // Supported text types for content extraction
        if (actualMimeType.startsWith('text/') || actualMimeType === 'application/json' || actualMimeType === 'application/csv') {
           const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
           const MAX_LENGTH = 50000; // Limit characters per file
           const truncatedContent = decodedData.length > MAX_LENGTH
             ? decodedData.substring(0, MAX_LENGTH) + "\n\n[Content truncated due to length]"
             : decodedData;
           return { success: true, content: truncatedContent };
        }
        // Known unsupported types (skipped for text content)
        if (actualMimeType === 'application/pdf') {
          return { success: false, content: "[Skipped PDF: Cannot extract text content.]" };
        }
        if (actualMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') { // XLSX
           return { success: false, content: "[Skipped XLSX: Cannot extract text content.]" };
        }
        if (actualMimeType === 'application/vnd.ms-excel') { // XLS
            return { success: false, content: "[Skipped XLS: Cannot extract text content.]" };
        }
        if (actualMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // DOCX
             return { success: false, content: "[Skipped DOCX: Cannot extract text content.]" };
        }
        if (actualMimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') { // PPTX
             return { success: false, content: "[Skipped PPTX: Cannot extract text content.]" };
        }
         if (actualMimeType === 'application/vnd.ms-project' || actualMimeType === 'application/msproj') { // MPP
           return { success: false, content: "[Skipped MPP: Cannot extract project file content.]" };
         }
         if (actualMimeType.startsWith('image/') || actualMimeType.startsWith('video/') || actualMimeType.startsWith('audio/')) {
           return { success: false, content: `[Skipped ${actualMimeType.split('/')[0].toUpperCase()}: Cannot extract text content.]` };
         }
         return { success: false, content: `[Skipped: Unsupported MIME type: ${actualMimeType}]` };
      } catch (err) {
        return { success: false, content: `[Error extracting content: ${(err as Error).message}]` };
      }
    }, []);

  // Add safe clipboard copy function
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        toast({
          title: "Success",
          description: "Text copied to clipboard",
        });
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setIsCopied(true);
          toast({
            title: "Success",
            description: "Text copied to clipboard",
          });
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to copy text to clipboard",
            variant: "destructive",
          });
        }
        
        textArea.remove();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Add this after the file upload handler
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      const documents = uploadedFiles
        .filter(file => file.textContent)
        .map(file => ({
          fileName: file.name,
          content: file.textContent || ''
        }));
      
      const questions = questionGenerator.generateQuestions(documents);
      setGeneratedQuestions(questions);
    } else {
      setGeneratedQuestions([]);
    }
  }, [uploadedFiles, questionGenerator]);

  // Add this function to generate example output
  const generateExampleOutput = (summary: string, suggestions: string[]) => {
    return `Based on the project analysis and customizations, here's an example of what you can expect:

Project Context:
${summary}

Key Areas of Focus:
${suggestions.map(s => `- ${s}`).join('\n')}

Example Response:
The AI will analyze your project's structure, focusing on:
1. Technical implementation details
2. Industry-specific requirements
3. Best practices and optimization opportunities
4. Potential challenges and solutions

The response will be tailored to your industry (${selectedIndustry?.value || 'selected industry'}) and will incorporate any custom requirements you specify.`;
  };

  // Update handleChatMessage to check for client-side rendering
  const handleChatMessage = async (message: string) => {
    if (!isClient) return;
    
    if (!projectSummary || !selectedIndustry) {
      toast({
        title: "Error",
        description: "Please complete the project analysis first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingChatInput(true);
    
    // Add user message to chat history
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message
    };
    
    const updatedChatHistory = [...chatHistory, userMessage];
    setChatHistory(updatedChatHistory);

    try {
      // Generate AI response based on the message and current context
      const aiResponse = await generateAIResponse(message);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse
      };

      // Update chat history with both messages
      const finalChatHistory = [...updatedChatHistory, aiMessage];
      setChatHistory(finalChatHistory);

      // Update suggestions and expected output based on the conversation
      const updatedSuggestions = [...promptSuggestions, message];
      setPromptSuggestions(updatedSuggestions);
      
      // Update expected output with new context
      const updatedOutput = generateExampleOutput(
        projectSummary,
        updatedSuggestions
      );
      setExpectedOutput(updatedOutput);

      // Save all updated settings
      setSavedSettings({
        uploadedFiles,
        selectedIndustry,
        projectSummary,
        promptSuggestions: updatedSuggestions,
        expectedOutput: updatedOutput,
        chatHistory: finalChatHistory
      });

      // Add the message to prompt customizations
      setPromptCustomizations(prev => [...prev, message]);

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.'
      };
      setChatHistory([...updatedChatHistory, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingChatInput(false);
    }
  };

  // Add function to generate AI response
  const generateAIResponse = async (message: string): Promise<string> => {
    // Here you would typically call your AI service
    // For now, we'll return a contextual response
    return `I understand you want to ${message}. Based on your project analysis:

1. Your project in the ${selectedIndustry?.value || 'selected'} industry
2. Current suggestions: ${promptSuggestions.join(', ')}
3. Project context: ${projectSummary?.substring(0, 100)}...

Would you like me to:
- Elaborate on any specific aspect?
- Provide more detailed suggestions?
- Focus on a particular area of your project?`;
  };

  // Update handleClearChat to check for client-side rendering
  const handleClearChat = () => {
    if (!isClient) return;
    
    setChatHistory([]);
    setSavedSettings({
      uploadedFiles,
      selectedIndustry,
      projectSummary,
      promptSuggestions,
      expectedOutput,
      chatHistory: []
    });
  };

  // Update handleAnalyzeProject to check for client-side rendering
  const handleAnalyzeProject = async () => {
    if (!isClient) return;
    
    if (uploadedFiles.length === 0 || !selectedIndustry) {
      setError("Please upload files and select an industry.");
      return;
    }

    // Start analysis process
    setIsSummarizing(true);
    setIsGeneratingSuggestions(true);
    setError(null);
    setProjectSummary(null);
    setPromptSuggestions([]);
    setExpectedOutput(null);
    setStageStatus('summarization', 'in-progress');
    setStageProgress('summarization', 50);

    try {
      // Step 1: Generate Project Summary
      const summaryInput: SummarizeProjectDataInput = {
        industry: selectedIndustry.value,
        files: uploadedFiles.map(f => ({
          fileDataUri: f.dataUri,
          fileName: f.name,
          mimeType: f.mimeType,
        })),
      };
      const summaryResponse = await errorHandler.withRetry('ai-analysis', () => 
        summarizeProjectData(summaryInput)
      );
      setProjectSummary(summaryResponse.summary);
      setStageStatus('summarization', 'completed');
      setStageProgress('summarization', 100);

      // Step 2: Generate Suggestions
      const combinedText = uploadedFiles.map(f => f.textContent || '').join('\n').trim();
      if (!combinedText) {
        throw new Error("Uploaded files do not contain any extractable text content.");
      }

      setStageStatus('suggestion-generation', 'in-progress');
      setStageProgress('suggestion-generation', 50);

      const suggestionsInput: GeneratePromptSuggestionsInput = {
        industry: selectedIndustry.value,
        projectSummary: summaryResponse.summary,
        combinedFileTextContent: combinedText,
      };
      const suggestionsResponse = await errorHandler.withRetry('suggestion-generation', () => 
        generatePromptSuggestions(suggestionsInput)
      );
      setPromptSuggestions(suggestionsResponse.suggestions);
      setStageStatus('suggestion-generation', 'completed');
      setStageProgress('suggestion-generation', 100);

      // After generating suggestions, create the example output
      const exampleOutput = generateExampleOutput(summaryResponse.summary, suggestionsResponse.suggestions);
      setExpectedOutput(exampleOutput);

      // Save settings after successful analysis
      setSavedSettings({
        uploadedFiles,
        selectedIndustry,
        projectSummary: summaryResponse.summary,
        promptSuggestions: suggestionsResponse.suggestions,
        expectedOutput: exampleOutput,
        chatHistory: [] // Reset chat history on new analysis
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(`Analysis failed: ${error.message}`);
      setProjectSummary(null);
      setPromptSuggestions([]);
      setStageStatus('summarization', 'error');
      setStageStatus('suggestion-generation', 'error');
    } finally {
      setIsSummarizing(false);
      setIsGeneratingSuggestions(false);
    }
  };

  // Add function to handle file upload with progress
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) {
      setUploadedFiles([]);
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError(null);

    try {
      const fileArray = Array.from(files);
      const uploaded = await Promise.all(
        fileArray.map(async (file, index) => {
          // Validate file type
          const validTypes = [
            'text/plain', 'text/markdown', 'application/json', 'text/csv',
            'application/javascript', 'application/typescript', 'text/x-python',
            'text/x-java-source', 'text/x-c', 'text/x-c++', 'text/x-csharp',
            'text/x-go', 'text/x-ruby', 'text/x-php', 'text/x-rust',
            'text/x-swift', 'text/x-kotlin', 'text/x-scala', 'text/x-sql',
            'text/html', 'text/css', 'text/x-scss', 'text/x-less',
            'text/xml', 'text/yaml', 'text/x-ini', 'text/x-env',
            'text/x-shellscript', 'text/x-batch', 'text/x-powershell',
            'text/x-dockerfile', 'text/x-toml', 'text/x-config',
            'text/x-properties', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-project'
          ];

          if (!validTypes.includes(file.type)) {
            throw new Error(`Invalid file type: ${file.type}. Please upload a supported file type.`);
          }

          // Check file size (max 10MB)
          const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
          }

          // Create a new FileReader for each file
          const reader = new FileReader();
          
          // Create a promise that resolves with the file data
          const fileData = await new Promise<{ dataUri: string; textContent?: string }>((resolve, reject) => {
            reader.onload = () => {
              const dataUri = reader.result as string;
              const { success, content } = extractTextFromDataUri(dataUri, file.type);
              resolve({
                dataUri,
                textContent: success ? content : undefined
              });
            };
            reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
            reader.readAsDataURL(file);
          });

          // Update progress for this file
          const fileProgress = ((index + 1) / fileArray.length) * 100;
          setUploadProgress(fileProgress);

          return {
            name: file.name,
            dataUri: fileData.dataUri,
            mimeType: file.type,
            textContent: fileData.textContent
          };
        })
      );

      setUploadStatus('processing');
      setUploadedFiles(uploaded);
      setUploadProgress(100);
      setUploadStatus('idle');

      // Show success message
      toast({
        title: "Success",
        description: `Successfully uploaded ${files.length} file(s)`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload files';
      setUploadError(errorMessage);
      setUploadStatus('error');
      setUploadProgress(0);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Add function to check network status
  const checkNetworkStatus = () => {
    if (!navigator.onLine) {
      setUploadError('No internet connection. Please check your network and try again.');
      setUploadStatus('error');
      return false;
    }
    return true;
  };

  // Add network status listener
  useEffect(() => {
    const handleOnline = () => {
      if (uploadStatus === 'error' && uploadError?.includes('No internet connection')) {
        setUploadError(null);
        setUploadStatus('idle');
      }
    };

    const handleOffline = () => {
      setUploadError('No internet connection. Please check your network and try again.');
      setUploadStatus('error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [uploadStatus, uploadError]);

  // Add function to clear all data
  const handleClearAll = async () => {
    try {
      // Clear front-end state
      setUploadedFiles([]);
      setProjectSummary(null);
      setPromptSuggestions([]);
      setCustomizationMessages([]);
      setPromptCustomizations([]);
      setOptimizedPrompt(null);
      setError(null);
      setChatHistory([]);
      setUploadProgress(0);
      setUploadStatus('idle');
      setUploadError(null);
      setExpectedOutput(null);
      setGeneratedQuestions([]);
      setPromptFeedback(null);
      setIsCopied(false);

      // Clear localStorage
      localStorage.removeItem('chatHistory');
      localStorage.removeItem('savedSettings');

      // Clear saved settings
      setSavedSettings({
        uploadedFiles: [],
        selectedIndustry: null,
        projectSummary: null,
        promptSuggestions: [],
        expectedOutput: null,
        chatHistory: []
      });

      // Reset progress tracker
      stages.forEach(stage => {
        setStageStatus(stage.id, 'pending');
        setStageProgress(stage.id, 0);
      });

      // Notify backend to clear session data
      try {
        const response = await fetch('/api/clear-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to clear server session');
        }

        toast({
          title: "Success",
          description: "All data has been cleared successfully",
        });
      } catch (error) {
        console.error('Error clearing server session:', error);
        toast({
          title: "Warning",
          description: "Front-end data cleared, but server session clear failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear all data';
      console.error('Error clearing data:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // If not client-side yet, show loading state
  if (!isClient) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl mb-8">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8" />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Add Clear All Button at the top */}
      <div className="w-full max-w-2xl mb-4 flex justify-end">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearAll}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear All Data
        </Button>
      </div>

      {/* Step 1: File Upload */}
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Upload Project Files</CardTitle>
          <CardDescription>
            Supported: .txt, .md, .json, .csv, .js, .ts, .py, .java, .c, .cpp, .cs, .go, .rb, .php, .rs, .swift, .kt, .scala, .sql, .html, .css, .scss, .less, .xml, .yml, .yaml, .ini, .env, .sh, .bat, .ps1, .dockerfile, .toml, .lock, .config, .properties, .pdf, .docx, .xlsx, .pptx, .mpp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload 
            onFileUpload={handleFileUpload}
            progress={uploadProgress}
            status={uploadStatus}
            error={uploadError}
          />
        </CardContent>
      </Card>

      {/* Step 2: Industry Selection */}
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Select Industry</CardTitle>
          <CardDescription>Choose the industry for prompt optimization.</CardDescription>
        </CardHeader>
        <CardContent>
          <IndustrySelector selectedIndustry={selectedIndustry} onSelectIndustry={setSelectedIndustry} />
        </CardContent>
      </Card>

      {/* Step 3: Project Analysis */}
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Project Analysis</CardTitle>
          <CardDescription>Analyze your project to generate a summary and suggestions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleAnalyzeProject}
            disabled={isSummarizing || isGeneratingSuggestions || uploadedFiles.length === 0 || !selectedIndustry}
            className="w-full"
          >
            {(isSummarizing || isGeneratingSuggestions) ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Analyzing Project...
              </>
            ) : (
              <>
                <Wand2 className="mr-2" />
                Analyze Project
              </>
            )}
          </Button>

          {/* Display Summary */}
          {projectSummary && (
            <Alert className="mt-4">
              <AlertTitle>Project Summary</AlertTitle>
              <AlertDescription>{projectSummary}</AlertDescription>
            </Alert>
          )}

          {/* Display Suggestions */}
          {promptSuggestions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Generated Suggestions</h3>
              <ul className="list-disc list-inside space-y-2">
                {promptSuggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Display Expected Output/Response */}
          {expectedOutput && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-4 w-4" />
                <h3 className="text-sm font-medium">Expected Output/Response</h3>
              </div>
              <ScrollArea className="h-[300px] w-full rounded-md border bg-black/5 p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {expectedOutput}
                </pre>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Set */}
      {generatedQuestions.length > 0 && (
        <Card className="w-full max-w-2xl mb-8">
          <CardHeader>
            <CardTitle>Explore Documents</CardTitle>
            <CardDescription>Generated questions to help you understand the uploaded documents.</CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionSet 
              questions={generatedQuestions}
              onQuestionClick={(question) => {
                if (question.text) {
                  setPromptSuggestions(prev => [...prev, question.text]);
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 5: Customization Chat */}
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Prompt Customization</CardTitle>
          <CardDescription>Chat with the AI to refine your prompt.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChatInterface
            messages={chatHistory}
            onSendMessage={handleChatMessage}
            onClearChat={handleClearChat}
            isLoading={isLoadingChatInput}
            disabled={!projectSummary || !selectedIndustry}
            promptSuggestions={promptSuggestions}
            isLoadingSuggestions={isGeneratingSuggestions}
            industry={selectedIndustry?.value || null}
            chatPurpose="customization"
            promptCustomizations={promptCustomizations}
          />
        </CardContent>
      </Card>

      {/* Step 6: Generate Optimized Prompt */}
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Generate Optimized Prompt</CardTitle>
          <CardDescription>Get your final, optimized prompt for your project.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={async () => {
            if (uploadedFiles.length === 0 || !selectedIndustry || !projectSummary) {
              setError("Please upload files and generate the summary first.");
              return;
            }
            const combinedText = uploadedFiles.map(f => f.textContent || '').join('\n').trim();
            if (!combinedText) {
              setError("Uploaded files do not contain any extractable text content. Please upload valid text-based files.");
              return;
            }
            if (isGeneratingFinalPrompt) return;
            setIsGeneratingFinalPrompt(true);
            setError(null);
            setOptimizedPrompt(null);
            setPromptFeedback(null);
            setStageStatus('prompt-generation', 'in-progress');
            setStageProgress('prompt-generation', 50);
            try {
              const input: GenerateOptimizedPromptInput = {
                industry: selectedIndustry.value,
                projectSummary: projectSummary,
                combinedFileTextContent: uploadedFiles.map(f => f.textContent || ''),
                customizations: promptCustomizations,
              };
              const response = await errorHandler.withRetry('prompt-generation', () => generateOptimizedPrompt(input));
              setOptimizedPrompt(response.optimizedPrompt);
              setIsCopied(false);
              setStageStatus('prompt-generation', 'completed');
              setStageProgress('prompt-generation', 100);
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              setError(`Failed to generate optimized prompt: ${error.message}`);
              setOptimizedPrompt(null);
              setStageStatus('prompt-generation', 'error');
            } finally {
              setIsGeneratingFinalPrompt(false);
            }
          }} disabled={isGeneratingFinalPrompt || uploadedFiles.length === 0 || !selectedIndustry || !projectSummary}>
            {isGeneratingFinalPrompt ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />} Generate Optimized Prompt
          </Button>
          {optimizedPrompt && (
            <div className="mt-4">
              <Textarea value={optimizedPrompt} readOnly rows={6} className="mb-2" />
              <Button
                variant={isCopied ? "default" : "outline"}
                onClick={() => copyToClipboard(optimizedPrompt || '')}
                className="mr-2"
              >
                {isCopied ? <Check className="mr-2" /> : <Copy className="mr-2" />} Copy
              </Button>
              <Button
                variant={promptFeedback === 'like' ? "default" : "outline"}
                onClick={() => setPromptFeedback('like')}
                className="mr-2"
              >
                <ThumbsUp className="mr-2" /> Like
              </Button>
              <Button
                variant={promptFeedback === 'dislike' ? "destructive" : "outline"}
                onClick={() => setPromptFeedback('dislike')}
              >
                <ThumbsDown className="mr-2" /> Dislike
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="w-full max-w-2xl mb-8">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Tracker */}
      <ProgressTracker stages={stages} currentStage={currentStage} />
    </main>
  );
}

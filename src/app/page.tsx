// src/app/page.tsx
'use client';

import type * as React from 'react';
import { useState, useCallback, useMemo, useRef } from 'react'; // Added useRef
import { summarizeProjectData, type SummarizeProjectDataInput } from '@/ai/flows/summarize-project-data';
import { generatePromptSuggestions, type GeneratePromptSuggestionsInput } from '@/ai/flows/generate-prompt-suggestions';
import { generateOptimizedPrompt, type GenerateOptimizedPromptInput } from '@/ai/flows/generate-optimized-prompt'; // Import the new flow
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { IndustrySelector, type Industry } from '@/components/IndustrySelector';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface, type Message } from '@/components/ChatInterface';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Loader2, Wand2, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react"; // Added ThumbsUp, ThumbsDown
import { Textarea } from "@/components/ui/textarea"; // Added Textarea for Step 5
import { useToast } from "@/hooks/use-toast"; // Import useToast hook
import { ProgressTracker } from "@/components/ProgressTracker";
import { useProgress } from "@/hooks/useProgress";


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
            return { success: false, content: `[Skipped Media File (${actualMimeType}): Cannot extract text content.]` };
         }
        // Catch-all for other unsupported types
        return { success: false, content: `[Skipped Unsupported File Type (${actualMimeType}): Cannot extract text content.]` };
      } catch (error) {
        console.error("Error decoding base64 data:", error);
        return { success: false, content: "[Error decoding file content.]" };
      }
  }, []);


  const handleFileUpload = useCallback(async (fileList: FileList | null) => {
    setError(null);
    setProjectSummary(null);
    setPromptSuggestions([]); // Clear suggestions
    setCustomizationMessages([]); // Clear customization chat
    setPromptCustomizations([]); // Clear customization data
    setOptimizedPrompt(null); // Clear final prompt
    setPromptFeedback(null); // Clear feedback
    if (!fileList || fileList.length === 0) {
      setUploadedFiles([]);
      return;
    }

    setIsReadingFiles(true);
    setCustomizationMessages([{ id: 'system-reading', role: 'system', content: 'reading' }]);
    setStageStatus('file-upload', 'in-progress');
    setStageProgress('file-upload', 50);

    const filesArray = Array.from(fileList);
    const fileReadPromises: Promise<UploadedFile>[] = [];

    filesArray.forEach((file) => {
      const promise = new Promise<UploadedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          const mimeType = file.type || 'application/octet-stream';
          const { success, content } = extractTextFromDataUri(dataUri, mimeType);
          // Store text content directly if successfully extracted
          resolve({ name: file.name, dataUri, mimeType, textContent: success ? content : content }); // Store skip message if not success
        };
        reader.onerror = (e) => {
          console.error(`Error reading file ${file.name}:`, e);
          // Reject with a more informative error message including the event if possible
          reject(new Error(`Failed to read file ${file.name}. Error: ${e ? String(e) : 'unknown'}`));
        };
        reader.readAsDataURL(file);
      });
      fileReadPromises.push(promise);
    });

    try {
      const newFilesData = await Promise.all(fileReadPromises);
      setUploadedFiles(newFilesData);
      setCustomizationMessages([]);
      setStageStatus('file-upload', 'completed');
      setStageProgress('file-upload', 100);
      moveToNextStage();
    } catch (err) {
      console.error("Error reading one or more files:", err); // Log the full error object
      const errorDetails = err instanceof Error ? err.message : String(err); // Get a string representation
      setError(`Error reading files: ${errorDetails}`); // Use the string representation
      setUploadedFiles([]);
      setCustomizationMessages([]);
      setStageStatus('file-upload', 'error');
    } finally {
      setIsReadingFiles(false);
    }
  }, [extractTextFromDataUri]);


  // Memoize combined text content to avoid recalculating on every render
  const combinedTextContent = useMemo(() => {
    let content = "";
    let processingErrors: string[] = [];
    uploadedFiles.forEach(file => {
        content += `\n\n--- File: ${file.name} (${file.mimeType}) ---\n${file.textContent}`;
        if (file.textContent?.startsWith("[")) { // Basic check for our skip messages
            processingErrors.push(`${file.name}: ${file.textContent}`);
        }
    });
     // Add error summary if some files were skipped
    if (processingErrors.length > 0) {
        const errorSummary = `Note: Some files could not be fully analyzed for content:\n- ${processingErrors.join('\n- ')}\n\nAnalysis based on available content:\n---\n`;
        return errorSummary + content.trim();
     }
    return content.trim();
  }, [uploadedFiles]);

  const handleGenerateSummaryAndSuggestions = async () => {
    if (uploadedFiles.length === 0 || !selectedIndustry) {
      setError("Please select an industry and upload at least one project file first.");
      return;
    }
    if (isSummarizing || isGeneratingSuggestions || isReadingFiles) return;

    setIsSummarizing(true);
    setError(null);
    setProjectSummary(null);
    setPromptSuggestions([]); // Clear old suggestions
    setCustomizationMessages([]); // Reset customization chat
    setPromptCustomizations([]); // Reset customizations
    setOptimizedPrompt(null); // Clear final prompt
    setPromptFeedback(null); // Clear feedback
    setStageStatus('ai-analysis', 'in-progress');
    setStageProgress('ai-analysis', 50);

    try {
      // Summarize
      const summaryInput: SummarizeProjectDataInput = {
        files: uploadedFiles.map(f => ({
          fileDataUri: f.dataUri,
          fileName: f.name,
          mimeType: f.mimeType,
        })),
        industry: selectedIndustry.value,
      };
      const summaryResponse = await summarizeProjectData(summaryInput);
      setProjectSummary(summaryResponse.summary);


      // Generate suggestions only if summary was successful
      if (summaryResponse.summary && !summaryResponse.summary.startsWith("Could not process")) {
        setIsGeneratingSuggestions(true);
        const suggestionsInput: GeneratePromptSuggestionsInput = {
           combinedFileTextContent: combinedTextContent, // Use pre-calculated combined text
           projectSummary: summaryResponse.summary,
           industry: selectedIndustry.value,
        };
        try {
           const suggestionsResponse = await generatePromptSuggestions(suggestionsInput);
           setPromptSuggestions(suggestionsResponse.suggestions);
        } catch (suggestionErr) {
             console.error("AI suggestion generation failed:", suggestionErr);
             setError("Generated summary, but failed to generate prompt customization suggestions.");
             setPromptSuggestions([]);
        } finally {
            setIsGeneratingSuggestions(false);
        }
      } else {
          setPromptSuggestions([]);
          if (!error && summaryResponse.summary) { // Only set error if summary exists and failed
              setError(summaryResponse.summary);
          }
      }

      setStageStatus('ai-analysis', 'completed');
      setStageProgress('ai-analysis', 100);
      moveToNextStage();
    } catch (err) {
      console.error("AI processing failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err); // Use String(err) as fallback
      setError(`AI processing failed: ${errorMessage}`);
      setProjectSummary(null);
      setPromptSuggestions([]);
      setStageStatus('ai-analysis', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };


  // Handles adding user input for customization (does not call AI)
  const handleAddCustomization = async (messageContent: string) => {
    if (isLoadingChatInput || isReadingFiles || isSummarizing || isGeneratingSuggestions || isGeneratingFinalPrompt) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageContent };
    setCustomizationMessages((prev) => [...prev.filter(m => m.role !== 'system'), userMessage]);
    setPromptCustomizations((prev) => [...prev, messageContent]); // Add the raw text to customizations list
    setPromptFeedback(null); // Clear feedback when customizations change
    // No AI call here, just updating state
  };

  // Function to clear the customization chat messages and stored customizations
  const handleClearCustomizations = () => {
    setCustomizationMessages([]);
    setPromptCustomizations([]); // Clear stored customization text
    setError(null); // Also clear any existing related errors
    setPromptFeedback(null); // Clear feedback when customizations are cleared
  };

  // Handle generating the final optimized prompt
  const handleGenerateFinalPrompt = async () => {
     if (uploadedFiles.length === 0 || !selectedIndustry || !projectSummary) {
      setError("Please upload files and generate the summary first.");
      return;
    }
    if (isProcessing || isGeneratingFinalPrompt) return;

    setIsGeneratingFinalPrompt(true);
    setError(null);
    setOptimizedPrompt(null); // Clear previous result
    setPromptFeedback(null); // Clear feedback for new prompt
    setStageStatus('prompt-generation', 'in-progress');
    setStageProgress('prompt-generation', 50);

    try {
        const input: GenerateOptimizedPromptInput = {
            industry: selectedIndustry.value,
            projectSummary: projectSummary,
            combinedFileTextContent: combinedTextContent,
            customizations: promptCustomizations, // Pass collected customizations
        };

        const response = await generateOptimizedPrompt(input);
        setOptimizedPrompt(response.optimizedPrompt);
        setIsCopied(false); // Reset copied state

        setStageStatus('prompt-generation', 'completed');
        setStageProgress('prompt-generation', 100);
    } catch (err) {
      console.error("Final prompt generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err); // Use String(err) as fallback
      setError(`Failed to generate optimized prompt: ${errorMessage}`);
      setOptimizedPrompt(null);
      setStageStatus('prompt-generation', 'error');
    } finally {
        setIsGeneratingFinalPrompt(false);
    }
  };

  // Handle copying the generated prompt
  const handleCopyPrompt = () => {
      if (optimizedPrompt) {
          navigator.clipboard.writeText(optimizedPrompt).then(() => {
              setIsCopied(true);
              toast({
                  title: "Copied!",
                  description: "Optimized prompt copied to clipboard.",
              });
              setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2s
          }).catch(err => {
              console.error('Failed to copy text: ', err);
              toast({
                  variant: "destructive",
                  title: "Copy Failed",
                  description: "Could not copy the prompt to clipboard.",
              });
          });
      }
  };

  // Handle prompt feedback
   const handleLikePrompt = () => {
    setPromptFeedback(prev => (prev === 'like' ? null : 'like'));
    // Optionally send feedback data
    console.log("Feedback: Liked");
    toast({ title: "Feedback Received", description: "Thanks for your feedback!" });
  };

  const handleDislikePrompt = () => {
    setPromptFeedback(prev => (prev === 'dislike' ? null : 'dislike'));
    // Optionally send feedback data
    console.log("Feedback: Disliked");
    toast({ title: "Feedback Received", description: "Thanks for your feedback!" });
  };


  // Determine combined loading state for disabling inputs
  const isProcessing = isReadingFiles || isSummarizing || isLoadingChatInput || isGeneratingSuggestions || isGeneratingFinalPrompt;
  const summaryActive = !!selectedIndustry && uploadedFiles.length > 0;
  const customizationActive = summaryActive && !!projectSummary && !projectSummary.startsWith("Could not process"); // Enable only if summary succeeded
  const generatePromptActive = customizationActive; // Can generate prompt once summary is done and valid

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Prompt Optimizer AI
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Generate optimized prompts tailored to your project data.
          </p>
        </header>

        {/* Add Progress Tracker */}
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Track your prompt generation progress</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressTracker
              stages={stages}
              currentStage={currentStage}
            />
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
             <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Industry Selection */}
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Step 1: Select Your Industry</CardTitle>
            <CardDescription>This helps tailor the initial analysis and prompt generation.</CardDescription>
          </CardHeader>
          <CardContent>
            <IndustrySelector
              selectedIndustry={selectedIndustry}
              onSelectIndustry={(industry) => {
                setSelectedIndustry(industry);
                setError(null); // Clear errors on industry change
                setProjectSummary(null);
                setPromptSuggestions([]);
                setCustomizationMessages([]);
                setPromptCustomizations([]);
                setOptimizedPrompt(null);
                setPromptFeedback(null); // Clear feedback
                setUploadedFiles([]);
              }}
              disabled={isProcessing && !!selectedIndustry}
            />
          </CardContent>
        </Card>


        {/* Step 2: File Upload */}
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Step 2: Upload Project Files</CardTitle>
            <CardDescription>Upload context files (e.g., .txt, .csv, .json). PDF, XLSX, DOCX, PPTX, MPP will be skipped for text extraction.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileUpload={handleFileUpload}
              disabled={isProcessing}
              accept=".txt,.csv,.json,.pdf,.xlsx,.xls,.mpp,.docx,.pptx" // Updated accepted types
            />
             {isReadingFiles && (
                <div className="flex items-center justify-center space-x-2 text-muted-foreground mt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reading files...</span>
                </div>
             )}
          </CardContent>
        </Card>

        {/* Step 3: Generate Summary & Suggestions */}
        <Card className={`w-full shadow-lg ${!summaryActive || isProcessing ? 'opacity-60' : ''}`}>
           <CardHeader>
            <CardTitle>Step 3: Generate Summary & Customization Suggestions</CardTitle>
            <CardDescription>Analyzes text from compatible files (TXT, CSV, JSON) to create a project summary and suggests areas for prompt customization.</CardDescription>
           </CardHeader>
           <CardContent>
             {(isSummarizing || isGeneratingSuggestions) ? (
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{isSummarizing ? 'Generating summary...' : 'Generating suggestions...'}</span>
                </div>
             ) : projectSummary ? (
                 <div className="space-y-3">
                   <h4 className="font-medium text-foreground">AI Generated Summary:</h4>
                    <ScrollArea className="h-40 w-full rounded-md border p-3 bg-muted/30">
                     {/* Display summary OR error message if summary failed */}
                     <p className="text-sm text-foreground whitespace-pre-wrap">{projectSummary}</p>
                   </ScrollArea>
                 </div>
               ) : (
                 <p className="text-sm text-muted-foreground italic text-center">
                   {uploadedFiles.length > 0 && selectedIndustry ? "Ready to generate summary and suggestions." : "Select industry and upload files first."}
                 </p>
             )}
           </CardContent>
          <CardFooter className="justify-center border-t pt-4">
             <Button
               onClick={handleGenerateSummaryAndSuggestions}
               disabled={!summaryActive || isProcessing}
             >
               {isSummarizing || isGeneratingSuggestions ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isSummarizing ? 'Summarizing...' : 'Getting Suggestions...'}
                 </>
               ) : projectSummary ? (
                  "Regenerate Summary & Suggestions"
               ) : (
                  "Generate Summary & Suggestions"
               )}
             </Button>
           </CardFooter>
         </Card>


        {/* Step 4: Customize Prompt */}
        <Card className={`w-full shadow-lg ${!customizationActive || isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
          <CardHeader>
            <CardTitle>Step 4: Customize Your Prompt</CardTitle>
            <CardDescription>
               {customizationActive ? "Use the suggestions or add specific details/requirements for the final prompt." : "Generate a successful summary & suggestions first to enable customization."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ChatInterface now handles customization input */}
            <ChatInterface
              messages={customizationMessages}
              onSendMessage={handleAddCustomization} // Changed to add customization
              onClearChat={handleClearCustomizations} // Pass clear function
              isLoading={isLoadingChatInput} // Use specific loading state if needed, but it's synchronous now
              disabled={!customizationActive || isProcessing}
              promptSuggestions={promptSuggestions} // Pass dynamic suggestions for customization
              isLoadingSuggestions={isGeneratingSuggestions}
              industry={selectedIndustry?.value}
              chatPurpose="customization" // Indicate the purpose of this chat
            />
          </CardContent>
        </Card>

        {/* Step 5: Generate & View Optimized Prompt */}
         <Card className={`w-full shadow-lg ${!generatePromptActive || isProcessing ? 'opacity-60' : ''}`}>
          <CardHeader>
            <CardTitle>Step 5: Generate & Copy Optimized Prompt</CardTitle>
            <CardDescription>
              {generatePromptActive ? "Click below to generate the final prompt based on the summary and your customizations." : "Complete previous steps first."}
            </CardDescription>
          </CardHeader>
           <CardContent className="space-y-4">
             {isGeneratingFinalPrompt ? (
               <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                 <Loader2 className="h-5 w-5 animate-spin" />
                 <span>Generating optimized prompt...</span>
               </div>
             ) : optimizedPrompt ? (
                <div className="relative space-y-3">
                   <Textarea
                     readOnly
                     value={optimizedPrompt}
                     className="w-full h-60 resize-none pr-12 bg-muted/30" // Add padding for the button
                     aria-label="Optimized Prompt"
                   />
                   {/* Copy Button */}
                   <Button
                     variant="ghost"
                     size="icon"
                     className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                     onClick={handleCopyPrompt}
                     aria-label={isCopied ? "Copied" : "Copy prompt"}
                   >
                     {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                   </Button>

                   {/* Feedback Buttons */}
                   <div className="flex justify-end space-x-2 pt-2">
                     <span className="text-sm text-muted-foreground mr-2">Was this prompt helpful?</span>
                     <Button
                       variant={promptFeedback === 'like' ? 'secondary' : 'ghost'}
                       size="icon"
                       className={`h-8 w-8 ${promptFeedback === 'like' ? 'text-primary border border-primary' : 'text-muted-foreground hover:text-primary'}`}
                       onClick={handleLikePrompt}
                       aria-pressed={promptFeedback === 'like'}
                       aria-label="Like the prompt"
                     >
                       <ThumbsUp className="h-4 w-4" />
                     </Button>
                     <Button
                       variant={promptFeedback === 'dislike' ? 'secondary' : 'ghost'}
                       size="icon"
                       className={`h-8 w-8 ${promptFeedback === 'dislike' ? 'text-destructive border border-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                       onClick={handleDislikePrompt}
                       aria-pressed={promptFeedback === 'dislike'}
                       aria-label="Dislike the prompt"
                     >
                       <ThumbsDown className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
             ) : (
               <p className="text-sm text-muted-foreground italic text-center">
                  {generatePromptActive ? "Ready to generate the optimized prompt." : "Complete previous steps first."}
               </p>
             )}
           </CardContent>
           <CardFooter className="justify-center border-t pt-4">
            <Button
                onClick={handleGenerateFinalPrompt}
                disabled={!generatePromptActive || isProcessing}
              >
                {isGeneratingFinalPrompt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : optimizedPrompt ? (
                  "Regenerate Optimized Prompt"
                ) : (
                  "Generate Optimized Prompt"
                )}
             </Button>
           </CardFooter>
         </Card>

      </div>
    </main>
  );
}

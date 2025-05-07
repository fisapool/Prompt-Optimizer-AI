// src/components/ChatInterface.tsx
'use client';

import type * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, Wand2, Trash2 } from 'lucide-react'; // Added Trash2
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip components
import { cn } from '@/lib/utils';


export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Static fallback prompts - now focused on customization aspects
const staticExamplePrompts: Record<string, string[]> = {
  general: [
    "Focus on the main objective.",
    "Emphasize the budget constraints.",
    "Target audience should be technical.",
    "Specify the desired output format as JSON.",
  ],
  construction: [
    "Highlight safety regulations.",
    "Specify LEED certification requirements.",
    "Mention the use of specific materials.",
    "Require a Gantt chart output.",
  ],
  software: [
    "Specify the programming language (e.g., Python).",
    "Require adherence to Agile methodology.",
    "Mention integration with specific APIs.",
    "Request code comments in the output.",
  ],
  healthcare: [
    "Emphasize patient confidentiality (HIPAA).",
    "Specify compliance with FDA regulations.",
    "Require anonymized data examples.",
    "Mention target demographic for a trial.",
  ],
  marketing: [
    "Specify the campaign tone (e.g., formal, casual).",
    "Define the primary call-to-action.",
    "Require A/B testing suggestions.",
    "Mention target social media platforms.",
  ],
};


interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  onClearChat: () => void; // Add clear chat handler prop
  isLoading: boolean; // Loading state for sending/receiving chat messages (now just for UI feedback)
  disabled?: boolean; // If the entire chat interface should be disabled
  promptSuggestions: string[]; // Dynamic suggestions from AI
  isLoadingSuggestions: boolean; // Loading state for fetching dynamic suggestions
  industry?: string | null; // Selected industry for fallback prompts
  chatPurpose?: 'chat' | 'customization'; // New prop to differentiate behavior
}

export function ChatInterface({
  messages,
  onSendMessage,
  onClearChat, // Destructure clear chat handler
  isLoading,
  disabled = false,
  promptSuggestions,
  isLoadingSuggestions,
  industry,
  chatPurpose = 'chat' // Default to 'chat'
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSendClick = () => {
    // In customization mode, sending just adds the input to the state via onSendMessage
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim()); // This function now just updates local state
      setInput('');
    }
  };

   const handlePromptClick = (prompt: string) => {
     if (!isLoading && !disabled) {
       // Append the suggestion to the current input, separated by a newline
       setInput((prevInput) => {
          const trimmedInput = prevInput.trim();
          if (trimmedInput === '') {
            return prompt;
          } else {
            return `${trimmedInput}\n${prompt}`; // Append with a newline
          }
       });
       // Focus the input field after adding a suggestion
       const inputElement = document.querySelector<HTMLInputElement>('[aria-label="Chat input"]');
       inputElement?.focus();
     }
   };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  };

  const handleClearClick = () => {
    if (!isLoading && !disabled) {
        onClearChat();
        setInput(''); // Clear input field as well
    }
  };


  useEffect(() => {
    // Auto-scroll logic remains the same
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTop = viewport.scrollHeight;
        });
      }
    }
  }, [messages, isLoading, isLoadingSuggestions]); // Scroll when suggestions load too

  const displayMessages = messages.filter(msg => msg.role !== 'system');

  // Determine which prompts to display
  // Group AI suggestions if present
  const aiSuggestions = promptSuggestions.length > 0 ? promptSuggestions : [];
  const fallbackSuggestions = (industry && staticExamplePrompts[industry]) ? staticExamplePrompts[industry] : staticExamplePrompts.general;

  const inputPlaceholder = disabled
    ? "Generate summary first..."
    : chatPurpose === 'customization'
      ? "Add prompt customization details..."
      : "Ask about your project(s)...";

  const sendButtonLabel = chatPurpose === 'customization' ? "Add Customization" : "Send Message";
  const clearButtonTooltip = chatPurpose === 'customization' ? "Clear Customizations" : "Clear Chat";
  const suggestionsTitle = chatPurpose === 'customization'
    ? (promptSuggestions.length > 0 ? "Suggested customizations (click to add):" : "Need ideas? Try these customization examples:")
    : (promptSuggestions.length > 0 ? "Suggested prompts based on your data:" : "Need inspiration? Try these examples:");
  const suggestionsFooter = chatPurpose === 'customization' ? "Or type your own customization below." : "Or type your own question below.";
  const disabledText = chatPurpose === 'customization'
      ? "Please select industry, upload file(s), and generate the summary & suggestions to enable prompt customization."
      : "Please select industry, upload file(s), and generate the summary & suggestions to enable chat.";


  return (
     <TooltipProvider delayDuration={100}> {/* Wrap with TooltipProvider */}
        <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
           <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
             <div className="space-y-4">
               {/* Show prompt suggestions area only if enabled and messages are empty */}
               {!disabled && displayMessages.length === 0 && (
                 <div className="text-center text-muted-foreground p-4 space-y-4">
                   {isLoadingSuggestions ? (
                     <div className="flex items-center justify-center gap-2 text-muted-foreground">
                       <Loader2 className="h-5 w-5 animate-spin" />
                       <span>Generating suggestions...</span>
                     </div>
                   ) : (
                     <>
                       {/* AI Suggestions Section */}
                       {aiSuggestions.length > 0 && (
                         <div className="mb-2">
                           <div className="flex items-center justify-center gap-2">
                             <Wand2 className="h-5 w-5 text-blue-500" />
                             <span className="font-semibold text-blue-700">AI Suggestions</span>
                             <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-xs text-blue-700">AI</span>
                           </div>
                           <div className="flex flex-wrap justify-center gap-2 mt-2">
                             {aiSuggestions.slice(0, 4).map((prompt, index) => (
                               <Button
                                 key={index}
                                 variant="outline"
                                 size="sm"
                                 className="text-xs md:text-sm border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-800"
                                 onClick={() => handlePromptClick(prompt)}
                                 disabled={isLoading || isLoadingSuggestions}
                               >
                                 <Sparkles className="inline-block mr-1 h-4 w-4 text-blue-400" />
                                 {prompt}
                               </Button>
                             ))}
                           </div>
                         </div>
                       )}
                       {/* Fallback/User Suggestions Section */}
                       {fallbackSuggestions.length > 0 && (
                         <div>
                           <div className="flex items-center justify-center gap-2">
                             <User className="h-5 w-5 text-green-500" />
                             <span className="font-semibold text-green-700">Your Customizations</span>
                           </div>
                           <div className="flex flex-wrap justify-center gap-2 mt-2">
                             {fallbackSuggestions.slice(0, 4).map((prompt, index) => (
                               <Button
                                 key={index}
                                 variant="outline"
                                 size="sm"
                                 className="text-xs md:text-sm border-green-400 bg-green-50 hover:bg-green-100 text-green-800"
                                 onClick={() => handlePromptClick(prompt)}
                                 disabled={isLoading || isLoadingSuggestions}
                               >
                                 {prompt}
                               </Button>
                             ))}
                           </div>
                         </div>
                       )}
                       <p className="mt-4">{suggestionsFooter}</p>
                     </>
                   )}
                 </div>
               )}
               {/* Message displayed when prerequisites are not met (chat explicitly disabled) */}
               {disabled && displayMessages.length === 0 && !isLoading && (
                 <div className="text-center text-muted-foreground p-4">
                   {disabledText}
                 </div>
               )}

              {/* Display actual messages (user inputs and potential future system responses) */}
              {displayMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* In customization mode, we might not have assistant messages, but keep for flexibility */}
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback><Bot size={18} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-4 py-2 break-words text-sm md:text-base shadow-sm",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground' // System/Assistant messages for context if needed
                    )}
                  >
                    {/* Handle multiline content */}
                    {message.content.split('\n').map((line, index) => (
                      <p key={index} className={cn("min-h-[1em]", index > 0 ? "mt-1" : "")}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback><User size={18} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {/* Loading indicator (less likely needed in customization mode unless suggestions are slow) */}
              {isLoading && chatPurpose === 'chat' && ( // Only show for actual chat interaction loading
                <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback><Bot size={18} /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 flex items-center space-x-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                     <span>Analyzing...</span>
                  </div>
                </div>
              )}
             </div>
          </ScrollArea>
          <div className="flex items-center p-4 border-t bg-background">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearClick}
                  disabled={isLoading || disabled || displayMessages.length === 0} // Disable if no messages or processing
                  className="mr-2 text-muted-foreground hover:text-destructive"
                  aria-label={clearButtonTooltip}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{clearButtonTooltip}</p>
              </TooltipContent>
            </Tooltip>

            <Input
              type="text"
              placeholder={inputPlaceholder}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 mr-2"
              disabled={isLoading || disabled || isLoadingSuggestions} // Disable during suggestion loading too
              aria-label="Chat input"
            />
            <Button
              onClick={handleSendClick}
              disabled={isLoading || !input.trim() || disabled || isLoadingSuggestions}
              aria-label={sendButtonLabel}
            >
              {/* Keep spinner for potential future async actions, but less critical now */}
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
    </TooltipProvider>
  );
}

// src/components/ChatInterface.tsx
'use client';

import type * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Example prompts based on potential use cases and industry
const examplePrompts: Record<string, string[]> = {
  general: [
    "Summarize the key milestones across all uploaded projects.",
    "Identify potential risks mentioned in the documents.",
    "What are the main dependencies between tasks or projects?",
    "List all team members mentioned and their roles/responsibilities if available.",
    "Are there any budget concerns or cost overruns mentioned?",
  ],
  construction: [
    "List all safety requirements or regulations mentioned.",
    "Identify key equipment or materials needed based on the files.",
    "What are the major phases described in the project data?",
    "Extract the project schedule or timeline details.",
    "Are there mentions of specific permits or inspections?",
  ],
  software: [
    "Summarize the main features planned based on the documents.",
    "Identify any technical debt or refactoring tasks mentioned.",
    "List the key APIs or integrations discussed.",
    "What are the testing requirements or strategies outlined?",
    "Are there mentions of specific programming languages or frameworks?",
  ],
  healthcare: [
    "Identify patient privacy (HIPAA) considerations mentioned.",
    "Summarize the clinical trial phases or milestones if applicable.",
    "List the regulatory approvals or compliance points discussed.",
    "Extract any research methodology described.",
    "Are there mentions of specific medical devices or procedures?",
  ],
  marketing: [
    "What is the target audience described for this campaign?",
    "Identify the key performance indicators (KPIs) mentioned.",
    "List the marketing channels or platforms discussed.",
    "Summarize the campaign budget allocation if available.",
    "What are the main campaign objectives outlined?",
  ],
};


interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean; // Represents chat-specific loading (sending/receiving messages)
  disabled?: boolean; // Explicitly controls if the chat is disabled (e.g., summary not ready)
  industry?: string | null; // Pass selected industry value for prompts
}

export function ChatInterface({ messages, onSendMessage, isLoading, disabled = false, industry }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSendClick = () => {
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

   const handlePromptClick = (prompt: string) => {
     if (!isLoading && !disabled) {
       setInput(prompt);
       // Optional: send immediately after clicking
       // onSendMessage(prompt);
       // setInput('');
     }
   };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTop = viewport.scrollHeight;
        });
      }
    }
  }, [messages, isLoading]); // Depend on messages and isLoading to scroll down

  const displayMessages = messages.filter(msg => msg.role !== 'system'); // Filter out system messages like 'reading'
  // Determine relevant prompts: Use industry-specific if available, otherwise general
   const relevantPrompts = (industry && examplePrompts[industry]) ? examplePrompts[industry] : examplePrompts.general;


  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
       <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
         <div className="space-y-4">
           {/* Show prompt suggestions only if chat is enabled, empty, and not loading */}
           {!disabled && displayMessages.length === 0 && !isLoading && (
             <div className="text-center text-muted-foreground p-4 space-y-4">
               <div className="flex items-center justify-center gap-2">
                 <Sparkles className="h-5 w-5 text-accent" />
                 <p className="font-medium text-foreground">Need inspiration? Try these prompts:</p>
               </div>
                <div className="flex flex-wrap justify-center gap-2">
                 {relevantPrompts.slice(0, 4).map((prompt, index) => (
                    <Button
                     key={index}
                     variant="outline"
                     size="sm"
                     className="text-xs md:text-sm"
                     onClick={() => handlePromptClick(prompt)}
                     disabled={isLoading} // Disable prompts while sending/receiving
                   >
                     {prompt}
                   </Button>
                 ))}
               </div>
               <p className="mt-4">Or type your own question below.</p>
             </div>
           )}
           {/* Message displayed when prerequisites are not met (chat explicitly disabled) */}
           {disabled && displayMessages.length === 0 && !isLoading && (
             <div className="text-center text-muted-foreground p-4">
                Please select industry, upload file(s), and generate the summary to enable chat.
             </div>
           )}

          {/* Display actual chat messages */}
          {displayMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
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
                    : 'bg-muted text-muted-foreground'
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
          {/* Loading indicator specifically for chat responses */}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback><Bot size={18} /></AvatarFallback>
              </Avatar>
              <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 flex items-center space-x-2 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                 <span>Analyzing...</span> {/* Changed from conditional text */}
              </div>
            </div>
          )}
         </div>
      </ScrollArea>
      <div className="flex items-center p-4 border-t bg-background">
        <Input
          type="text"
          placeholder={disabled ? "Generate summary first..." : "Ask about your project(s)..."}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 mr-2"
          disabled={isLoading || disabled}
          aria-label="Chat input"
        />
        <Button
          onClick={handleSendClick}
          disabled={isLoading || !input.trim() || disabled}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}


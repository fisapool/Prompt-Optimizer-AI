// src/components/ChatInterface.tsx
'use client';

import type * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, Wand2 } from 'lucide-react'; // Added Wand2
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

// Static fallback prompts
const staticExamplePrompts: Record<string, string[]> = {
  general: [
    "Summarize the key milestones.",
    "Identify potential risks.",
    "What are the main dependencies?",
    "List team members mentioned.",
  ],
  construction: [
    "List safety requirements.",
    "Identify key equipment/materials.",
    "What are the major phases?",
    "Extract the schedule details.",
  ],
  software: [
    "Summarize main features.",
    "Identify technical debt.",
    "List key APIs/integrations.",
    "Outline testing requirements.",
  ],
  healthcare: [
    "Identify HIPAA considerations.",
    "Summarize clinical trial phases.",
    "List regulatory approvals.",
    "Extract research methodology.",
  ],
  marketing: [
    "What is the target audience?",
    "Identify KPIs.",
    "List marketing channels.",
    "Summarize campaign budget.",
  ],
};


interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean; // Loading state for sending/receiving chat messages
  disabled?: boolean; // If the entire chat interface should be disabled
  promptSuggestions: string[]; // Dynamic suggestions from AI
  isLoadingSuggestions: boolean; // Loading state for fetching dynamic suggestions
  industry?: string | null; // Selected industry for fallback prompts
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  disabled = false,
  promptSuggestions,
  isLoadingSuggestions,
  industry
}: ChatInterfaceProps) {
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
  const promptsToShow = promptSuggestions.length > 0
    ? promptSuggestions
    : (industry && staticExamplePrompts[industry])
      ? staticExamplePrompts[industry]
      : staticExamplePrompts.general;


  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
       <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
         <div className="space-y-4">
           {/* Show prompt suggestions area only if chat is enabled and messages are empty */}
           {!disabled && displayMessages.length === 0 && (
             <div className="text-center text-muted-foreground p-4 space-y-4">
               {isLoadingSuggestions ? (
                 <div className="flex items-center justify-center gap-2 text-muted-foreground">
                   <Loader2 className="h-5 w-5 animate-spin" />
                   <span>Generating suggestions...</span>
                 </div>
               ) : (
                 <>
                   <div className="flex items-center justify-center gap-2">
                     <Wand2 className="h-5 w-5 text-accent" /> {/* Use Wand2 for generated prompts */}
                     <p className="font-medium text-foreground">
                        {promptSuggestions.length > 0 ? "Suggested prompts based on your data:" : "Need inspiration? Try these examples:"}
                      </p>
                   </div>
                    <div className="flex flex-wrap justify-center gap-2">
                     {promptsToShow.slice(0, 4).map((prompt, index) => (
                        <Button
                         key={index}
                         variant="outline"
                         size="sm"
                         className="text-xs md:text-sm"
                         onClick={() => handlePromptClick(prompt)}
                         disabled={isLoading || isLoadingSuggestions} // Disable while loading anything
                       >
                         {prompt}
                       </Button>
                     ))}
                   </div>
                   <p className="mt-4">Or type your own question below.</p>
                 </>
               )}
             </div>
           )}
           {/* Message displayed when prerequisites are not met (chat explicitly disabled) */}
           {disabled && displayMessages.length === 0 && !isLoading && (
             <div className="text-center text-muted-foreground p-4">
                Please select industry, upload file(s), and generate the summary & suggestions to enable chat.
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
                 <span>Analyzing...</span>
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
          disabled={isLoading || disabled || isLoadingSuggestions} // Disable during suggestion loading too
          aria-label="Chat input"
        />
        <Button
          onClick={handleSendClick}
          disabled={isLoading || !input.trim() || disabled || isLoadingSuggestions}
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

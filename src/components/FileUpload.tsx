'use client';

import type * as React from 'react';
import { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUpload: (file: File | null) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileUpload, disabled = false }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    onFileUpload(file);
    // Reset input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = (event: React.MouseEvent<HTMLButtonElement>) => {
     event.stopPropagation(); // Prevent triggering the label's click
     event.preventDefault(); // Prevent default button behavior if inside a form
    setSelectedFile(null);
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // You can add visual cues here if needed
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      onFileUpload(file);
    }
  };


  return (
    <div className="space-y-2">
      <Label
        htmlFor="file-upload"
        className={cn(
          "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent/50 transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-border",
          disabled ? "cursor-not-allowed opacity-50" : ""
        )}
        onDragEnter={disabled ? undefined : handleDragEnter}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDragOver={disabled ? undefined : handleDragOver}
        onDrop={disabled ? undefined : handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
          {selectedFile ? (
             <>
               <p className="mb-2 text-sm text-foreground font-semibold">{selectedFile.name}</p>
               <p className="text-xs text-muted-foreground">
                 ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB) - Click or drag to replace
               </p>
               <Button
                 variant="ghost"
                 size="sm"
                 className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                 onClick={handleClearFile} // Use the specific handler
                 aria-label="Remove selected file"
               >
                 <X className="mr-1 h-4 w-4" /> Remove
               </Button>
             </>
          ) : (
            <>
              <p className="mb-2 text-sm text-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                (e.g., .mpp, .xlsx, .csv, .pdf)
              </p>
             </>
          )}
        </div>
        <Input
          id="file-upload"
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".mpp,.xlsx,.xls,.csv,.pdf,.json" // Add common project file types
          disabled={disabled}
        />
      </Label>
      {!selectedFile && (
         <Button onClick={handleButtonClick} disabled={disabled} className="w-full sm:w-auto">
           Browse Files
         </Button>
      )}
    </div>
  );
}

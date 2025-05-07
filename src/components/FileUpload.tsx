// src/components/FileUpload.tsx
'use client';

import type * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, File as FileIcon } from 'lucide-react'; // Added FileIcon
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea
import { Badge } from '@/components/ui/badge'; // Added Badge
import { cn } from '@/lib/utils';
import { FilePreview } from "./FilePreview";

interface FileUploadProps {
  onFileUpload: (files: FileList | null) => void;
  disabled?: boolean;
  accept?: string; // Allow specifying accepted file types
}

export function FileUpload({
  onFileUpload,
  disabled = false,
  accept = ".txt,.csv,.json,.pdf,.xlsx,.xls,.mpp,.docx,.pptx", // Default accept types including docx, pptx
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      // Prevent duplicates based on name and size (simple check)
      const uniqueNewFiles = newFiles.filter(newFile =>
        !selectedFiles.some(existingFile =>
          existingFile.name === newFile.name && existingFile.size === newFile.size
        )
      );
      const updatedFiles = [...selectedFiles, ...uniqueNewFiles];
      setSelectedFiles(updatedFiles);
      // Create a new FileList for the callback
      const dataTransfer = new DataTransfer();
      updatedFiles.forEach(file => dataTransfer.items.add(file));
      onFileUpload(dataTransfer.files.length > 0 ? dataTransfer.files : null);
    } else {
      setSelectedFiles([]);
      onFileUpload(null);
    }
    // Reset input value to allow uploading the same file(s) again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileUpload, selectedFiles]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Updated to clear all selected files
  const handleClearAllFiles = (event: React.MouseEvent<HTMLButtonElement>) => {
     event.stopPropagation();
     event.preventDefault();
     setSelectedFiles([]);
     onFileUpload(null);
     if (fileInputRef.current) {
       fileInputRef.current.value = '';
     }
  };

   // Function to remove a specific file
   const handleRemoveFile = (indexToRemove: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(updatedFiles);

    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
    onFileUpload(dataTransfer.files.length > 0 ? dataTransfer.files : null);

    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input value
      }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    // Only set to false if not dragging over a child element
     if ((event.target as Element).id === 'dropzone-label') {
       setIsDragging(false);
     }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    // Indicate drag is allowed
     event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <Label
        id="dropzone-label"
        htmlFor="file-upload"
        className={cn(
          "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent/50 transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-border",
          disabled ? "cursor-not-allowed opacity-50" : ""
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
          <p className="mb-2 text-sm text-foreground">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground px-2">
            Multiple files allowed (e.g., .txt, .csv, .json, .pdf, .xlsx, .docx, .pptx, .mpp). Text content extracted from TXT, CSV, JSON.
          </p>
          {selectedFiles.length === 0 && (
            <Button onClick={handleButtonClick} disabled={disabled} className="mt-4 sm:w-auto" size="sm">
              Browse Files
            </Button>
          )}
        </div>
        <input
          id="file-upload"
          type="file"
          accept={accept}
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple // Allow multiple files
          className="hidden"
          disabled={disabled}
        />
      </Label>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-foreground">Selected Files ({selectedFiles.length}):</h4>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleClearAllFiles}
            disabled={disabled}
            aria-label="Remove all selected files"
          >
            <X className="mr-1 h-4 w-4" /> Clear All
          </Button>
        </div>
        <ScrollArea className="h-40 w-full rounded-md border p-2">
          <div className="space-y-2 pr-2">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-secondary-foreground truncate" title={file.name}>{file.name}</span>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  onClick={(e) => handleRemoveFile(index, e)}
                  disabled={disabled}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Preview Selected File</h4>
            <FilePreview file={selectedFiles[0]} chunkSize={65536} />
            {selectedFiles.length > 1 && (
              <div className="text-xs text-muted-foreground mt-2">(Previewing first file only. Please select one at a time for preview.)</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

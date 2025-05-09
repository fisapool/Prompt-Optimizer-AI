// src/components/FileUpload.tsx
'use client';

import type * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FilePreview } from "./FilePreview";

// Define supported file types and their MIME types
const SUPPORTED_FILE_TYPES = {
  // Text files
  '.txt': ['text/plain'] as const,
  '.md': ['text/markdown', 'text/x-markdown'] as const,
  '.csv': ['text/csv', 'application/csv'] as const,
  
  // Document files
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] as const,
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const,
  '.pdf': ['application/pdf'] as const,
} as const;

// Create a type for all possible MIME types
type SupportedMimeType = typeof SUPPORTED_FILE_TYPES[keyof typeof SUPPORTED_FILE_TYPES][number];

// Create a flat array of all supported MIME types
const SUPPORTED_MIME_TYPES: SupportedMimeType[] = Object.values(SUPPORTED_FILE_TYPES).flat();

// Create a string of accepted file extensions for the input element
const ACCEPTED_FILE_EXTENSIONS = Object.keys(SUPPORTED_FILE_TYPES).join(',');

interface FileUploadProps {
  onFileUpload: (files: FileList | null) => void;
  disabled?: boolean;
  accept?: string;
  progress?: number;
  status?: 'idle' | 'uploading' | 'processing' | 'error';
  error?: string | null;
}

export function FileUpload({
  onFileUpload,
  disabled = false,
  accept = ACCEPTED_FILE_EXTENSIONS,
  progress = 0,
  status = 'idle',
  error = null,
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to validate file type
  const validateFileType = (file: File): boolean => {
    // Get the file extension
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    // Special handling for spreadsheet files
    if (fileExtension === '.xls' || fileExtension === '.xlsx') {
      if (file.type === 'application/vnd.ms-excel' || 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // This is a supported spreadsheet file
        return true;
      } else {
        setValidationError('We do not support these types of file uploads, remove these types');
        return false;
      }
    }
    
    // For other file types, check if the file's MIME type is in our supported list
    const isValidMimeType = SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType);
    
    // Check if the extension is in our supported list
    const isValidExtension = Object.keys(SUPPORTED_FILE_TYPES).includes(fileExtension);
    
    return isValidMimeType || isValidExtension;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      
      // Validate each file
      const invalidFiles = newFiles.filter(file => !validateFileType(file));
      
      if (invalidFiles.length > 0) {
        const supportedTypes = Object.keys(SUPPORTED_FILE_TYPES).join(', ');
        setValidationError(`There seems to be an issue with the file. Supported file types: ${supportedTypes}`);
        return;
      }
      
      // Clear any previous validation errors
      setValidationError(null);
      
      // Prevent duplicates based on name and size
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

  const handleClearAllFiles = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setSelectedFiles([]);
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(updatedFiles);

    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
    onFileUpload(dataTransfer.files.length > 0 ? dataTransfer.files : null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    if ((event.target as Element).id === 'dropzone-label') {
      setIsDragging(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
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
        data-testid="dropzone-label"
        htmlFor="file-upload"
        className={cn(
          "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent/50 transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-border",
          disabled ? "cursor-not-allowed opacity-50" : "",
          status === 'error' || validationError ? "border-destructive" : ""
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadCloud className={cn(
            "w-10 h-10 mb-3",
            status === 'error' || validationError ? "text-destructive" : "text-muted-foreground"
          )} />
          <p className="mb-2 text-sm text-foreground">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground px-2">
            Supported files: {Object.keys(SUPPORTED_FILE_TYPES).join(', ')}
          </p>
          {selectedFiles.length === 0 && (
            <Button onClick={handleButtonClick} disabled={disabled} className="mt-4 sm:w-auto" size="sm">
              Browse Files
            </Button>
          )}
        </div>
        <input
          id="file-upload"
          data-testid="file-upload"
          type="file"
          accept={accept}
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          disabled={disabled}
        />
      </Label>

      {/* Validation Error Message */}
      {validationError && (
        <div className="text-sm text-destructive mt-2">
          {validationError}
        </div>
      )}

      {/* Progress Bar */}
      {(status === 'uploading' || status === 'processing') && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{status === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive mt-2">
          There seems to be an issue with code
        </div>
      )}

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

export default FileUpload;

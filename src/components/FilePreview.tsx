import React, { useState, useEffect } from "react";
import { Loading } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";

interface FilePreviewProps {
  file: File;
  chunkSize?: number; // bytes per chunk, default 64KB
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, chunkSize = 65536 }) => {
  const [content, setContent] = useState<string>("");
  const [offset, setOffset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    setContent("");
    setOffset(0);
    setHasMore(true);
  }, [file]);

  const readChunk = (start: number) => {
    setIsLoading(true);
    const reader = new FileReader();
    const blob = file.slice(start, start + chunkSize);
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent((prev) => prev + text);
      setOffset(start + chunkSize);
      setIsLoading(false);
      setHasMore(start + chunkSize < file.size);
    };
    reader.onerror = () => {
      setIsLoading(false);
      setHasMore(false);
    };
    reader.readAsText(blob);
  };

  useEffect(() => {
    // Load first chunk automatically
    if (content === "" && hasMore && !isLoading) {
      readChunk(0);
    }
    // eslint-disable-next-line
  }, [file]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      readChunk(offset);
    }
  };

  return (
    <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4">
      <pre className="whitespace-pre-wrap break-all">{content}</pre>
      {isLoading && (
        <div className="space-y-2 mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isLoading}
          className={`
            mt-4 px-4 py-2 rounded-md transition-all duration-200
            ${isLoading 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }
            flex items-center justify-center space-x-2
          `}
        >
          {isLoading ? (
            <Loading text="Loading more content" size="sm" />
          ) : (
            'Load More'
          )}
        </button>
      )}
      {!hasMore && (
        <div className="text-muted-foreground mt-4 text-sm">
          End of file
        </div>
      )}
    </div>
  );
};

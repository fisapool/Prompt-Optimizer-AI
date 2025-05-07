import React, { useState, useEffect } from "react";

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
    <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid #eee", padding: 8 }}>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{content}</pre>
      {hasMore && (
        <button onClick={handleLoadMore} disabled={isLoading} style={{ marginTop: 8 }}>
          {isLoading ? "Loading..." : "Load More"}
        </button>
      )}
      {!hasMore && <div style={{ color: "#888", marginTop: 8 }}>End of file</div>}
    </div>
  );
};
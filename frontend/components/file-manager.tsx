"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Paperclip, X, File, Trash2, FolderOpen, Upload } from "lucide-react";

// Define the file interface
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dateUploaded: Date;
  folderId?: string; // Optional folder grouping
  content?: string; // Could be actual file data or a URL/path to the file
  thumbnail?: string; // For image files
}

// Define the folder interface for organizing files
export interface FileFolder {
  id: string;
  name: string;
  dateCreated: Date;
  parentId?: string; // For nested folders (future feature)
}

interface FileManagerProps {
  files: UploadedFile[];
  onFileUpload: (files: UploadedFile[]) => void;
  onFileDelete: (fileId: string) => void;
  onFileSelect: (fileId: string) => void;
  selectedFiles: string[]; // Array of selected file IDs
  className?: string;
}

export function FileManager({
  files,
  onFileUpload,
  onFileDelete,
  onFileSelect,
  selectedFiles,
  className
}: FileManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter files based on search query
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle file selection through the file input
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      
      const newFiles: UploadedFile[] = Array.from(e.target.files).map(file => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dateUploaded: new Date(),
        content: URL.createObjectURL(file), // Create a temporary URL for the file
        thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      
      // In production, this would send the file to the server and then update the UI
      setTimeout(() => {
        onFileUpload(newFiles);
        setIsUploading(false);
      }, 1000); // Simulating upload time
    }
  };

  // Trigger the file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelection}
        className="hidden"
        multiple
      />
      
      {/* File manager header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <FolderOpen className="mr-2 h-5 w-5 text-indigo-500" />
          My Files
        </h3>
        
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-60"
          />
          
          <Button
            onClick={triggerFileInput}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>
      
      {/* Upload progress or empty state */}
      {isUploading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg p-4 mb-4 flex items-center"
        >
          <div className="mr-3">
            <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>Uploading files...</div>
        </motion.div>
      )}
      
      {!isUploading && files.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4"
          >
            <Paperclip className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </motion.div>
          <h4 className="text-lg font-medium mb-2">No files uploaded yet</h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Upload files to organize your sources and reference them in your conversation.</p>
          <Button 
            onClick={triggerFileInput}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Upload Files
          </Button>
        </motion.div>
      )}
      
      {/* File grid */}
      {files.length > 0 && (
        <div className={cn(
          "grid gap-4",
          view === "grid" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
        )}>
          <AnimatePresence>
            {filteredFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col",
                  selectedFiles.includes(file.id) && "ring-2 ring-indigo-500"
                )}
              >
                {/* File preview/thumbnail */}
                <div 
                  className="aspect-video bg-gray-100 dark:bg-gray-700 relative flex items-center justify-center"
                  onClick={() => onFileSelect(file.id)}
                >
                  {file.thumbnail ? (
                    <img 
                      src={file.thumbnail} 
                      alt={file.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <File className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  )}
                  
                  {/* Selection indicator */}
                  {selectedFiles.includes(file.id) && (
                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                      <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* File info */}
                <div className="p-3 flex-grow">
                  <h4 className="font-medium text-sm truncate" title={file.name}>{file.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {file.dateUploaded.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileDelete(file.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 h-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

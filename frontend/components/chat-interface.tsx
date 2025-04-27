"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { LinkIcon, Mic, Paperclip, Send, CheckCircle2 } from "lucide-react"
import { MultiStepLoader, LoadingState } from "./multi-step-loader"
import { motion } from "framer-motion"

// Import types
import { 
  Message, 
  Attachment,
  ProcessingStage,
  SpeechRecognition,
  SpeechRecognitionEvent,
  Source
} from "@/app/types"

// Import API services
import { sendMessageToAgent, processAgentResponse } from "@/lib/api"

// Definition for the initialization steps
type InitStep = {
  label: string
  status: "completed" | "in-progress" | "pending"
}

// Source interface (if not already defined in types.ts)
interface SourceData {
  id: string;
  title: string;
  url: string;
  description?: string;
  dateAdded: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Sources states
  const [showSourcesModal, setShowSourcesModal] = useState(false)
  const [attachedSources, setAttachedSources] = useState<SourceData[]>([])
  const [sourceInput, setSourceInput] = useState({ title: "", url: "", description: "" })
  const [isDraggingSource, setIsDraggingSource] = useState(false)
  const [draggedSource, setDraggedSource] = useState<SourceData | null>(null)
  const [showDropzone, setShowDropzone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // New states for the multi-step loader
  const [showLoader, setShowLoader] = useState(false)
  const [loaderStates] = useState<LoadingState[]>([
    { text: "Analyzing your request..." },
    { text: "Searching knowledge base..." },
    { text: "Extracting relevant information..." },
    { text: "Generating response..." },
    { text: "Preparing for display..." },
    { text: "Finalizing AI response..." }
  ])

  // Web Speech API recognition setup
  const recognition = useRef<any>(null)

  // State for the initialization animation (we'll set this to false immediately)
  const [showInitAnimation, setShowInitAnimation] = useState(true)
  
  // Initialize on first load - no animation at the beginning
  useEffect(() => {
    setShowInitAnimation(false)
  }, [])

  useEffect(() => {
    // Initialize speech recognition if supported
    if (typeof window !== 'undefined' && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      // @ts-ignore - Browser API compatibility
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = true
      recognition.current.interimResults = true

      recognition.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("")

        setInputValue(transcript)
      }

      recognition.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
      }

      recognition.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Toggle speech recognition
  const toggleListening = () => {
    if (!recognition.current) {
      alert("Speech recognition is not supported in your browser.")
      return
    }

    if (isListening) {
      recognition.current.stop()
      setIsListening(false)
    } else {
      recognition.current.start()
      setIsListening(true)
    }
  }

  // Process user message and get AI response
  const processMessage = async (userMessage: string) => {
    try {
      // Show the loader during processing, but don't add message to state yet
      setShowLoader(true)
      
      // Store message temporarily but don't display it
      const tempMessage = {
        id: Date.now().toString(),
        type: "user" as const,
        content: userMessage,
      }
      
      // Wait for the multi-step loader to complete
      // This simulates the actual API call and processing
      await new Promise((resolve) => {
        // We will wait for the onComplete callback from the loader
        // The actual API call will be simulated during the loader animation
        setTimeout(resolve, 8000) // Fallback timeout just in case
      })
      
      // Send message to the AI agent backend (this is now just simulated since the loader handles the visual feedback)
      let processedMessage = "I understand your request: \"" + userMessage + "\". How can I assist you further?"
      let attachments: Attachment[] = []
      
      // If we have attached sources, include them in the message
      if (attachedSources.length > 0) {
        processedMessage = `I've analyzed your request: "${userMessage}" using the ${attachedSources.length} ${attachedSources.length === 1 ? 'source' : 'sources'} you provided. Here's what I found...`

        // Add the sources as attachments
        attachedSources.forEach(source => {
          attachments.push({
            type: 'link',
            url: source.url,
            title: source.title
          })
        })
      }
      
      try {
        // In a real implementation, this would be uncommented
        // const response = await sendMessageToAgent(userMessage, attachedSources)
        // const processedResponse = processAgentResponse(response)
        // processedMessage = processedResponse.message
        // 
        // if (processedResponse.type === 'function' && processedResponse.result) {
        //   attachments.push({
        //     type: 'link',
        //     url: '#',
        //     title: `Function: ${processedResponse.function}`
        //   })
        // }
      } catch (apiError) {
        console.error('API error:', apiError)
      }
      
      // Now add both the user message and AI response at once after loader completes
      setMessages((prev: Message[]) => [
        ...prev,
        // First add the user message
        tempMessage,
        // Then add the AI response
        {
          id: Date.now().toString() + '-response',
          type: "ai",
          content: processedMessage,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
      ])
    } catch (error) {
      console.error('Error processing message:', error)
      
      // Add error message
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "ai",
          content: "Sorry, I encountered an error while processing your request. Please try again later.",
        },
      ])
    } finally {
      // Hide the loader when done
      setProcessingStage(null)
      setShowLoader(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (inputValue.trim() && !isListening) {
      if (recognition.current) {
        recognition.current.stop()
        setIsListening(false)
      }

      const userMessage = inputValue.trim()
      setInputValue("")

      // Don't add the message to the list immediately
      // Instead, process the message and show the loader
      // The message will be added after processing is complete
      processMessage(userMessage)
    }
  }

  // Derived state - do we have messages?
  const hasMessages = messages.length > 0

  // Handle adding a new source
  const addSource = () => {
    if (sourceInput.url.trim() && sourceInput.title.trim()) {
      setAttachedSources([
        ...attachedSources,
        {
          id: Date.now().toString(),
          title: sourceInput.title,
          url: sourceInput.url,
          description: sourceInput.description,
          dateAdded: new Date()
        }
      ])
      setSourceInput({ title: "", url: "", description: "" })
    }
  }

  // Handle removing a source
  const removeSource = (id: string) => {
    setAttachedSources(attachedSources.filter(source => source.id !== id))
  }
  
  // Handle dragging a source
  const handleDragStart = (source: SourceData) => {
    setIsDraggingSource(true)
    setDraggedSource(source)
    setShowDropzone(true)
  }
  
  // Handle dropping a source on the input
  const handleDrop = () => {
    if (draggedSource) {
      // Focus the input
      inputRef.current?.focus()
      
      // If there's already content, add a space
      const prefix = inputValue ? `${inputValue} ` : ''
      
      // Add the source reference to the input
      setInputValue(`${prefix}[Source: ${draggedSource.title}] `)
    }
    
    // Reset drag state
    setIsDraggingSource(false)
    setDraggedSource(null)
    setShowDropzone(false)
  }
  
  // Handle dragging over the input
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Needed to allow drop
  }
  
  // Handle drag end (whether dropped or cancelled)
  const handleDragEnd = () => {
    setIsDraggingSource(false)
    setDraggedSource(null)
    setShowDropzone(false)
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Sources modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Manage Sources</h3>
              <Button 
                type="button" 
                onClick={() => setShowSourcesModal(false)}
                className="h-8 w-8 rounded-full p-0 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </Button>
            </div>
            
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input 
                  type="text" 
                  value={sourceInput.title}
                  onChange={(e) => setSourceInput({...sourceInput, title: e.target.value})}
                  placeholder="Document name or title"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <Input 
                  type="text" 
                  value={sourceInput.url}
                  onChange={(e) => setSourceInput({...sourceInput, url: e.target.value})}
                  placeholder="https://example.com/document"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <Input 
                  type="text" 
                  value={sourceInput.description}
                  onChange={(e) => setSourceInput({...sourceInput, description: e.target.value})}
                  placeholder="Brief description of this source"
                  className="w-full"
                />
              </div>
              
              <Button 
                onClick={addSource}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!sourceInput.url.trim() || !sourceInput.title.trim()}
              >
                Add Source
              </Button>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium mb-3">Attached Sources ({attachedSources.length})</h4>
              {attachedSources.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No sources attached yet. Add sources above to provide context for the AI.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {attachedSources.map(source => (
                    <motion.div 
                      key={source.id} 
                      className={cn(
                        "flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-grab relative",
                        draggedSource?.id === source.id && "shadow-xl ring-2 ring-indigo-500/50"
                      )}
                      draggable="true"
                      onDragStart={() => handleDragStart(source)}
                      onDragEnd={handleDragEnd}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Drag handle icon */}
                      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-6 h-10 bg-gray-200 dark:bg-gray-600 rounded-l-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400">
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="8" cy="16" r="1.5" />
                          <circle cx="16" cy="8" r="1.5" />
                          <circle cx="16" cy="16" r="1.5" />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{source.title}</h5>
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block">
                          {source.url}
                        </a>
                        {source.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{source.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <div className="text-gray-400 dark:text-gray-500 text-xs mr-2 self-center">
                          Drag to input
                        </div>
                        <button 
                          onClick={() => removeSource(source.id)}
                          className="ml-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New multi-step loader that appears when processing user input */}
      <MultiStepLoader 
        loadingStates={loaderStates}
        loading={showLoader}
        duration={1200}
        loop={false}
      />
      
      {/* Old initialization animation - we no longer use this */}
      {showInitAnimation && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-50">
          <div className="w-full max-w-md p-8 rounded-xl animate-fadeIn">
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold animate-pulse-custom">
                U
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ChatGPT-style interface that changes based on whether there are messages */}
      {hasMessages ? (
        // Conversation view - shows when conversation has started
        <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-4 px-6 sticky top-0 z-10 shadow-sm">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    setMessages([])
                    // Reset other states for completely fresh start
                    setAttachedSources([])
                    setInputValue("")
                    setShowLoader(false)
                    setProcessingStage(null)
                  }} 
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8V4H8"></path>
                      <path d="M12 4h4"></path>
                      <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                      <path d="m6 16 4-2 4 2 4-2"></path>
                    </svg>
                  </div>
                  <h2 className="text-lg font-medium">Unified AI Agent</h2>
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Button 
                    type="button"
                    onClick={() => setShowSourcesModal(!showSourcesModal)}
                    className="flex items-center gap-2 text-sm px-4 py-2 h-9 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Sources
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      {attachedSources.length}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-grow overflow-y-auto py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-10">
              {messages.map((message: Message) => (
                <div key={message.id} className={cn(
                  "flex",
                  message.type === "user" ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "flex max-w-[85%]",
                    message.type === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    {/* Message content */}
                    <div>
                      <div className={cn(
                        "p-4 rounded-xl text-base",
                        message.type === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      )}>
                        {message.content}
                      </div>

                      {/* Message attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <LinkIcon className="w-3.5 h-3.5" />
                              {attachment.type === 'link' ? (
                                <a 
                                  href={attachment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                  {attachment.title}
                                </a>
                              ) : (
                                <span>{attachment.title}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Sources indicator - only shown for AI messages */}
                      {message.type === "ai" && attachedSources.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <button 
                            onClick={() => setShowSourcesModal(true)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <path d="m15 3 6 6"></path>
                              <path d="m21 3-6 6"></path>
                            </svg>
                            <span>Using {attachedSources.length} {attachedSources.length === 1 ? 'source' : 'sources'}</span>
                          </button>
                        </div>
                      )}
                      
                      {/* Message timestamp */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                        {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Processing indicator */}
              {processingStage && (
                <div className="flex max-w-3xl mx-auto">
                  <div className="flex max-w-[85%]">
                    <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 min-w-[60px]">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom div for scrolling to the latest message */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      ) : (
        // Empty state with truly centered input - ChatGPT style with input in the middle
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 px-4 relative overflow-hidden">
          {/* Background animated elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute h-64 w-64 rounded-full bg-purple-500/10 filter blur-3xl"
              animate={{
                x: ["0%", "60%", "20%"],
                y: ["10%", "40%", "30%"],
                scale: [1, 1.2, 0.9],
              }}
              transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
              style={{ top: '10%', left: '10%' }}
            />
            <motion.div 
              className="absolute h-64 w-64 rounded-full bg-blue-500/10 filter blur-3xl"
              animate={{
                x: ["0%", "-30%", "10%"],
                y: ["0%", "20%", "-10%"],
                scale: [1, 0.8, 1.1],
              }}
              transition={{ duration: 18, repeat: Infinity, repeatType: "reverse" }}
              style={{ top: '50%', right: '20%' }}
            />
            <motion.div 
              className="absolute h-64 w-64 rounded-full bg-indigo-500/10 filter blur-3xl"
              animate={{
                x: ["0%", "20%", "-20%"],
                y: ["0%", "-30%", "10%"],
                scale: [1, 1.1, 0.9],
              }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
              style={{ bottom: '10%', left: '30%' }}
            />
          </div>

          <div className="w-full max-w-3xl mx-auto flex flex-col items-center h-screen relative z-10">
            {/* Top section with logo, title and prompt */}
            <div className="flex flex-col items-center justify-end flex-grow">
              {/* Logo animation */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg"
              >
                <motion.div 
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="text-white text-4xl font-bold"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8V4H8"></path>
                    <path d="M12 4h4"></path>
                    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                    <path d="m6 16 4-2 4 2 4-2"></path>
                  </svg>
                </motion.div>
              </motion.div>
              
              {/* Title/Welcome */}
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-4xl font-bold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600"
              >
              What's on the agenda today?
              </motion.h1>
            </div>
            
            {/* Middle section with the input - THIS IS THE CENTER OF ATTENTION */}
            <div className="w-full py-8">
              <motion.form 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                onSubmit={(e) => handleSubmit(e)} 
                className="flex items-center gap-2"
              >
                <div 
                  className={cn(
                    "flex-1 relative",
                    showDropzone && "z-10"
                  )}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {/* Dropzone indicator - shown when dragging */}
                  {showDropzone && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-full flex items-center justify-center z-10"
                    >
                      <div className="text-indigo-500 dark:text-indigo-400 font-medium text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Drop source to reference in prompt
                      </div>
                    </motion.div>
                  )}
                  
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Message Unified AI Agent..."
                    className="w-full border-0 shadow-lg dark:shadow-gray-700/20 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-800 py-4 px-5 rounded-full text-base"
                    autoFocus
                  />
                </div>
                <Button 
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "rounded-full h-12 w-12 shadow-sm", 
                    isListening 
                      ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100 hover:text-red-600" 
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-full h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </motion.form>
            </div>
            
            {/* Bottom section with features */}
            <div className="flex-grow flex flex-col items-center justify-start w-full">
              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl"
              >
                {[
                  { 
                    title: "Complete Homework", 
                    description: "Get help with assignments and problem-solving",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2z"></path>
                        <path d="M7 7h10"></path>
                        <path d="M7 11h10"></path>
                        <path d="M7 15h4"></path>
                      </svg>
                    )
                  },
                  { 
                    title: "Organize Notes", 
                    description: "Organize your notes and study materials",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
                        <rect x="9" y="3" width="6" height="4" rx="2"></rect>
                        <path d="M9 12h6"></path>
                        <path d="M9 16h6"></path>
                      </svg>
                    ) 
                  },
                  { 
                    title: "Code Generation", 
                    description: "Edit, run, and write code anywhere",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                    )
                  },
                  { 
                    title: "Schedule Management", 
                    description: "Organize your calendar and meetings",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    )
                  },
                ].map((feature, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + (i * 0.1), duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                    }}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3 text-indigo-600 dark:text-indigo-300">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Input area - always visible when chatting */}
      {hasMessages && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-10 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={(e) => handleSubmit(e)} className="flex items-center gap-2">
              <div 
                className={cn(
                  "flex-1 relative",
                  showDropzone && "z-10"
                )}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Dropzone indicator - shown when dragging */}
                {showDropzone && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-full flex items-center justify-center z-10"
                  >
                    <div className="text-indigo-500 dark:text-indigo-400 font-medium text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Drop source to reference in prompt
                    </div>
                  </motion.div>
                )}
                
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Message Unified AI Agent..."
                  className="w-full border-0 shadow-md dark:shadow-gray-700/20 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-800 py-3 px-4 rounded-full text-base"
                  autoFocus
                />
              </div>
              <Button 
                type="button"
                onClick={toggleListening}
                className={cn(
                  "rounded-full h-12 w-12 shadow-sm", 
                  isListening 
                    ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100 hover:text-red-600" 
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Button 
                type="submit" 
                className="rounded-full h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

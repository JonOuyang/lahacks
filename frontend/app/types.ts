// Type definitions for the app

// Message types
export type MessageType = "user" | "ai"
export type ProcessingStage = "parsing" | "planning" | "executing" | null

export interface Attachment {
  type: "link" | "file"
  url: string
  title: string
}

export interface Message {
  id: string
  type: MessageType
  content: string
  attachments?: Attachment[]
}

export interface Source {
  id: string
  title: string
  url: string
  description?: string
  dateAdded: Date
}

// API response types
export interface AgentTextResponse {
  type: "text"
  message: string
}

export interface AgentFunctionResponse {
  type: "function"
  function: string
  args: Record<string, any>
  message: string
  result?: string
}

export type AgentResponse = AgentTextResponse | AgentFunctionResponse

// Web Speech API types for TypeScript
export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
  error?: any
}

export interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

export interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

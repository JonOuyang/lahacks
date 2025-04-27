"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Import the chat interface with SSR disabled
const ChatInterface = dynamic(
  () => import('@/components/chat-interface'),
  { ssr: false }
)

export default function Home() {
  // Use state to track if we're rendering on the client
  const [isMounted, setIsMounted] = useState(false)
  
  // Only run after component mounts on the client
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Return nothing during SSR
  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
          <p className="text-gray-500">Please wait while we prepare your AI assistant</p>
        </div>
      </div>
    )
  }
  
  // Once we're on the client, render the chat interface
  return <ChatInterface />
}

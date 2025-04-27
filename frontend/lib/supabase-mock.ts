// This is a mock implementation of Supabase client
// In a real application, you would use the actual Supabase client

export interface SupabaseMockResponse {
  success: boolean
  data?: any
  error?: string
}

class SupabaseMock {
  // Mock method to simulate sending a message to the AI
  async sendMessage(message: string): Promise<SupabaseMockResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Always return success in this mock
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        content: "This is a simulated response from the AI.",
        timestamp: new Date().toISOString(),
      },
    }
  }

  // Mock method to simulate fetching conversation history
  async getConversationHistory(): Promise<SupabaseMockResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      data: [
        {
          id: "1",
          type: "ai",
          content: "Hello! How can I assist you today?",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          type: "user",
          content: "Can you help me with a coding problem?",
          timestamp: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: "3",
          type: "ai",
          content: "Of course! Please describe the problem you're facing.",
          timestamp: new Date(Date.now() - 3400000).toISOString(),
        },
      ],
    }
  }
}

// Export a singleton instance
export const supabaseMock = new SupabaseMock()

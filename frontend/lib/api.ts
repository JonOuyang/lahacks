// API service for interacting with the Python backend

/**
 * Send a message to the AI agent
 * @param prompt The user prompt to send to the AI
 * @returns The AI response including any function calls or text response
 */
export async function sendMessageToAgent(prompt: string) {
  try {
    const response = await fetch('http://localhost:5000/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to communicate with agent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error communicating with agent:', error);
    throw error;
  }
}

/**
 * Handles the different types of responses from the AI agent
 * @param response The response from the AI agent
 * @returns Processed response appropriate for display
 */
export function processAgentResponse(response: any) {
  if (response.type === 'function') {
    // Process function response
    return {
      type: 'function',
      function: response.function,
      message: response.message,
      result: response.result || 'Function executed',
    };
  } else {
    // Process text response
    return {
      type: 'text',
      message: response.message,
    };
  }
}

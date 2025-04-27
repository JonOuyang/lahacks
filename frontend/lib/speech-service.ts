// Speech services for transcription and synthesis

// Function to transcribe audio using Eleven Labs API
export async function transcribeAudioWithElevenLabs(audioBlob: Blob): Promise<string> {
  try {
    // Convert blob to base64
    const base64data = await blobToBase64(audioBlob);
    
    // Since we can't make direct API calls from the frontend,
    // we need to send this to our backend API
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: base64data,
        // You can include additional parameters like model, language if needed
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.transcription;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

// Helper function to convert Blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Record audio and return as blob
export function startRecording(): Promise<MediaRecorder> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      resolve(mediaRecorder);
    } catch (error) {
      reject(error);
    }
  });
}

// Stop recording and get audio blob
export function stopRecording(mediaRecorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve) => {
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
      // Stop all tracks of the stream
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      resolve(blob);
    };
    
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });
}

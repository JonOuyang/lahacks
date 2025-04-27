import { NextRequest, NextResponse } from 'next/server';

// Replace with your actual Eleven Labs API key
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { audio } = await req.json();
    
    if (!audio) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }
    
    // Convert base64 back to binary
    const binaryData = Buffer.from(audio, 'base64');
    
    // Create a blob to send to Eleven Labs
    const formData = new FormData();
    formData.append('audio', new Blob([binaryData], { type: 'audio/ogg' }));
    
    // Make request to Eleven Labs Speech-to-Text API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY || '',
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Eleven Labs API Error:', errorData);
      return NextResponse.json(
        { error: `Eleven Labs API Error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      transcription: data.text || '',
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

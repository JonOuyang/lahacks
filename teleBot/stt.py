import os
import aiohttp

async def transcribe_audio_with_elevenlabs(file_path: str) -> str:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    url = "https://api.elevenlabs.io/v1/speech-to-text"
    headers = {
        "xi-api-key": api_key
    }
    data = {
        "model_id": "scribe_v1",
        "diarize": "false",
        "tag_audio_events": "false"
    }
    async with aiohttp.ClientSession() as session:
        with open(file_path, 'rb') as f:
            form = aiohttp.FormData()
            form.add_field('model_id', data['model_id'])
            form.add_field('diarize', data['diarize'])
            form.add_field('tag_audio_events', data['tag_audio_events'])
            form.add_field('file', f, filename=os.path.basename(file_path), content_type='audio/ogg')
            async with session.post(url, headers=headers, data=form) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    return result.get("text", "")
                else:
                    error_text = await resp.text()
                    raise Exception(f"Transcription failed: {error_text}")

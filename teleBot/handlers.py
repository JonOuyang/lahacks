from aiogram import types, Bot
import aiohttp
import os
import asyncio
import ffmpeg
from aiogram.types import FSInputFile
from backend import send_to_backend
from stt import transcribe_audio_with_elevenlabs
import random

ROBOT_REPLIES = [
    "Got it! What would you like me to do next?",
    "I understand. How can I help you with that?",
    "I'm on it! Anything else you need?",
    "Consider it done. What's next on your list?",
    "I'll take care of that right away.",
    "Thanks for letting me know. What else can I do for you?",
    "Perfect! Is there anything else you'd like me to handle?",
    "I'm here and ready to help with whatever you need.",
    "Sounds good! I'll get started on that now.",
    "I hear you loud and clear. What would you like me to focus on?",
    "I'm with you. What's your next thought?",
    "All set! What would you like to tackle next?",
    "I've got that covered. How else can I assist you today?",
    "I'm following you. What other ideas do you have?",
    "Makes sense to me. Where should we go from here?",
    "I see what you mean. How would you like to proceed?",
    "Happy to help with that. What's on your mind now?",
    "Absolutely! I'm ready for your next request.",
    "I understand completely. What would be helpful now?",
    "Let's do it! What's your next step?"
]

# Make sure your folders exist
os.makedirs("temp_audio", exist_ok=True)
os.makedirs("temp_images", exist_ok=True)

# Function: Generate ElevenLabs voice from text (MP3)
async def synthesize_text_elevenlabs(text: str, filename: str = "temp_audio/generated.mp3"):
    api_key = os.getenv("ELEVENLABS_API_KEY")
    url = os.getenv("ELEVENLABS_URL")

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1"
    }

    print(f"ELEVENLABS_URL = {url}")
    print(f"ELEVENLABS_API_KEY = {api_key}")

    timeout = aiohttp.ClientTimeout(total=10)

    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(url, headers=headers, json=payload) as resp:
            print(f"Status: {resp.status}")
            if resp.status == 200:
                with open(filename, "wb") as f:
                    f.write(await resp.read())
            else:
                error_text = await resp.text()
                print(f"ElevenLabs Error: {error_text}")
                raise Exception(f"ElevenLabs TTS failed: {error_text}")

# Function: Convert MP3 to OGG
def convert_mp3_to_ogg(mp3_path: str, ogg_path: str):
    (
        ffmpeg
        .input(mp3_path)
        .output(
            ogg_path,
            format='ogg',
            acodec='libopus',
            ar='48000',  # Sample rate: 48000Hz
            ac='1',      # Channels: mono
            audio_bitrate='64k',
            compression_level='10'  # highest compression for voice
        )
        .overwrite_output()
        .run(quiet=True)
    )

# Function: Send an OGG voice file
async def reply_with_voice(message: types.Message, bot: Bot, file_path: str):

    print ("Voice sent!")
    await bot.send_chat_action(chat_id=message.chat.id, action="upload_voice")

    voice_file = FSInputFile(file_path, filename=os.path.basename(file_path))

    await bot.send_voice(
        chat_id=message.chat.id,
        voice=voice_file,
        caption=None,
    )

# Text handler
async def handle_text(message: types.Message, bot: Bot):
    await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    await asyncio.sleep(1)

    await send_to_backend({
        "type": "text",
        "content": message.text,
        "user_id": message.from_user.id,
    })

    temp_mp3 = f"temp_audio/{message.message_id}_generated.mp3"
    temp_ogg = f"temp_audio/{message.message_id}_generated.ogg"

    try:
        robot_text = random.choice(ROBOT_REPLIES)

        await synthesize_text_elevenlabs(robot_text, filename=temp_mp3)
        convert_mp3_to_ogg(temp_mp3, temp_ogg)
        await reply_with_voice(message, bot, temp_ogg)
    except Exception as e:
        print(f"Exception caught: {str(e)}")
        await message.answer(f"Error: {str(e)}")
    finally:
        await asyncio.sleep(0.5)
        if os.path.exists(temp_mp3):
            os.remove(temp_mp3)
        if os.path.exists(temp_ogg):
            os.remove(temp_ogg)

# Photo handler
async def handle_photo(message: types.Message, bot: Bot):
    photo = message.photo[-1]
    file_info = await bot.get_file(photo.file_id)
    file_path = f"temp_images/{photo.file_unique_id}.jpg"

    await bot.download_file(file_info.file_path, destination=file_path)

    await bot.send_chat_action(chat_id=message.chat.id, action="upload_photo")
    await asyncio.sleep(1)

    await send_to_backend({
        "type": "photo",
        "photo_file_id": photo.file_id,
        "user_id": message.from_user.id,
    })

    temp_mp3 = f"temp_audio/{message.message_id}_generated.mp3"
    temp_ogg = f"temp_audio/{message.message_id}_generated.ogg"

    try:
        robot_text = random.choice(ROBOT_REPLIES)

        await synthesize_text_elevenlabs(robot_text, filename=temp_mp3)
        convert_mp3_to_ogg(temp_mp3, temp_ogg)
        await reply_with_voice(message, bot, temp_ogg)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.exists(temp_mp3):
            os.remove(temp_mp3)
        if os.path.exists(temp_ogg):
            os.remove(temp_ogg)

# Audio handler
async def handle_audio(message: types.Message, bot: Bot):
    voice = message.voice or message.audio
    file_info = await bot.get_file(voice.file_id)
    file_path = f"temp_audio/{voice.file_unique_id}.ogg"

    await bot.download_file(file_info.file_path, destination=file_path)

    await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    await asyncio.sleep(1.5)

    temp_mp3 = f"temp_audio/{message.message_id}_generated.mp3"
    temp_ogg = f"temp_audio/{message.message_id}_generated.ogg"

    transcription = await transcribe_audio_with_elevenlabs(file_path)

    await send_to_backend({
        "type": "audio",
        "transcription": transcription,
        "user_id": message.from_user.id,
    })

    try:
        await message.answer(f"Here’s what I heard: \"{transcription}\"")
        
        robot_text = random.choice(ROBOT_REPLIES)
        await synthesize_text_elevenlabs(robot_text, filename=temp_mp3)
        convert_mp3_to_ogg(temp_mp3, temp_ogg)
        await reply_with_voice(message, bot, temp_ogg)
    except Exception as e:
        await message.answer(f"Oops, something went wrong while transcribing: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.exists(temp_mp3):
            os.remove(temp_mp3)
        if os.path.exists(temp_ogg):
            os.remove(temp_ogg)

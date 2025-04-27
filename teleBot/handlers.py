from aiogram import types, Bot
import aiohttp
import os
import asyncio
import ffmpeg
from aiogram.types import FSInputFile
from backend import send_to_backend
from stt import transcribe_audio_with_elevenlabs
import random
from groq import Groq
import soundfile as sf

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

# Load Groq API key
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Ensure folders exist
os.makedirs("temp_audio", exist_ok=True)
os.makedirs("temp_images", exist_ok=True)

# Function: Generate Groq voice from text (WAV)
async def synthesize_text_groq(text: str, filename: str = "temp_audio/generated.wav"):
    with client.audio.speech.with_streaming_response.create(
        model="playai-tts",
        voice="Nia-PlayAI",  # or change voice if you want
        response_format="wav",
        input=text,
    ) as response:
        response.stream_to_file(filename)

# Function: Convert WAV to OGG
def convert_wav_to_ogg(wav_path: str, ogg_path: str):
    (
        ffmpeg
        .input(wav_path)
        .output(
            ogg_path,
            format='ogg',
            acodec='libopus',
            ar='48000',  # Sample rate: 48000Hz
            ac='1',      # Channels: mono
            audio_bitrate='64k',
            compression_level='10'
        )
        .overwrite_output()
        .run(quiet=True)
    )

# Function: Send an OGG voice file
async def reply_with_voice(message: types.Message, bot: Bot, file_path: str):
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

    temp_wav = f"temp_audio/{message.message_id}_generated.wav"
    temp_ogg = f"temp_audio/{message.message_id}_generated.ogg"

    try:
        robot_text = random.choice(ROBOT_REPLIES)

        await synthesize_text_groq(robot_text, filename=temp_wav)
        convert_wav_to_ogg(temp_wav, temp_ogg)
        await reply_with_voice(message, bot, temp_ogg)
    except Exception as e:
        print(f"Exception caught: {str(e)}")
        await message.answer(f"Error: {str(e)}")
    finally:
        await asyncio.sleep(0.5)
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
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

    temp_wav = f"temp_audio/{message.message_id}_generated.wav"
    temp_ogg = f"temp_audio/{message.message_id}_generated.ogg"

    try:
        robot_text = random.choice(ROBOT_REPLIES)

        await synthesize_text_groq(robot_text, filename=temp_wav)
        convert_wav_to_ogg(temp_wav, temp_ogg)
        await reply_with_voice(message, bot, temp_ogg)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
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

    temp_wav = f"temp_audio/{message.message_id}_generated.wav"
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

        await synthesize_text_groq(robot_text, filename=temp_wav)
        convert_wav_to_ogg(temp_wav, temp_ogg)
        await reply_with_voice(message, bot, temp_ogg)
    except Exception as e:
        await message.answer(f"Oops, something went wrong: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
        if os.path.exists(temp_ogg):
            os.remove(temp_ogg)

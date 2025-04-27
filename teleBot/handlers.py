from aiogram import types
from backend import send_to_backend

async def handle_text(message: types.Message):
    await send_to_backend({
        "type": "text",
        "content": message.text,
        "user_id": message.from_user.id,
    })
    await message.answer("Text sent to backend ✅")

async def handle_photo(message: types.Message):
    photo = message.photo[-1]  # Best quality
    file = await photo.download()
    await send_to_backend({
        "type": "photo",
        "photo_file_id": photo.file_id,
        "user_id": message.from_user.id,
    })
    await message.answer("Photo sent to backend ✅")

async def handle_audio(message: types.Message):
    voice = message.voice or message.audio
    file = await voice.download(destination_dir="temp_audio/")  # Optional: download locally
    # Here you would normally call your speech-to-text service
    transcription = "dummy_transcription"  # Replace with real transcription
    await send_to_backend({
        "type": "audio",
        "transcription": transcription,
        "user_id": message.from_user.id,
    })
    await message.answer("Audio sent to backend ✅")

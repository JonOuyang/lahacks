import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
import config
import handlers

bot = Bot(token=config.BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def command_start_handler(message: types.Message):
    await message.answer("Hello! Send me text, pictures, or audio!")

# Register handlers
async def audio_handler_wrapper(message: types.Message):
    await handlers.handle_audio(message, bot)

async def text_handler_wrapper(message: types.Message):
    await handlers.handle_text(message, bot)

async def photo_handler_wrapper(message: types.Message):
    await handlers.handle_photo(message, bot)

dp.message.register(audio_handler_wrapper, lambda message: message.voice or message.audio)
dp.message.register(text_handler_wrapper, lambda message: message.text is not None)
dp.message.register(photo_handler_wrapper, lambda message: message.photo)


async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())

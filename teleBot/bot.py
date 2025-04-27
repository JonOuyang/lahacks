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
dp.message.register(handlers.handle_text, lambda message: message.text is not None)
dp.message.register(handlers.handle_photo, lambda message: message.photo)
dp.message.register(handlers.handle_audio, lambda message: message.voice or message.audio)

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())

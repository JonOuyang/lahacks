import aiohttp
import config

async def send_to_backend(data: dict):
    async with aiohttp.ClientSession() as session:
        async with session.post(config.BACKEND_URL, json=data) as resp:
            return await resp.text()

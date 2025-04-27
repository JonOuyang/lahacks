import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
BACKEND_URL = "http://127.0.0.1:8000/receive"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
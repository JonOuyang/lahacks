from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow any client to call your API (important for testing or remote bots)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all domains (ok for local testing)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define a POST route to receive text from the Telegram bot
@app.post("/receive")
async def receive_text(request: Request):
    data = await request.json()
    print("Received data:", data)  # Logs to terminal

    if data.get("type") == "text":
        text = data.get("content", "No content received")
    elif data.get("type") == "photo":
        text = data.get("photo_file_id", "No content received")
    elif data.get("type") == "audio":
        text = data.get("transcription", "No content received")

    return {
        "message": f"Received text: {text}"
    }

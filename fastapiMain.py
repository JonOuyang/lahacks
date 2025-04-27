from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from main import orchestrator_call

app = FastAPI()

# Allow any client to call your API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define a POST route to receive text from the Telegram bot
@app.post("/receive")
async def receive_text(request: Request):
    data = await request.json()
    print("Received data:", data)

    text = data.get("content") or data.get("photo_file_id") or data.get("transcription") or "No content received"

    print(f"Passing to orchestrator: {text}")

    orchestrator_call(text)

    return {"message": f"Processed text: {text}"}

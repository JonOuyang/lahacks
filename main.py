import os
import sys
import time
import threading

from dotenv import load_dotenv
from google import genai
from google.genai import types
import base64

# Load API keys
load_dotenv()

def orchestrator_call(prompt):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


    model = "gemini-2.5-flash-preview-04-17"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
    )

    # for chunk in client.models.generate_content_stream(
    #     model=model,
    #     contents=contents,
    #     config=generate_content_config,
    # ):
    #     print(chunk.text, end="")
    
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config
    )
    print(response.text)

if __name__ == "__main__":
    orchestrator_call('introduce yourself')
    
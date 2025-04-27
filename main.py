import os
import sys
import time
import threading

print('hello world')

from dotenv import load_dotenv
from google import genai
from google.genai import types
import base64

# Load API keys
load_dotenv()

# FUNCTION IMPORTS
from agent_functions.homework import complete_homework
from agent_functions.jupyter import edit_jupyter
from agent_functions.organize_notes import organize_notes
from agent_functions.quiz import quiz
from agent_functions.slack import send_files_to_slack, schedule_meetings

# FUNCTION DECLARATIONS
complete_homework_function = {
    "name": "complete_homework",
    "description": "empty description",
}

edit_jupyter_function = {
    "name": "edit_jupyter",
    "description": "open the jupyter notebook file and begin editing it",
}

organize_notes_function = {
    "name": "organize_notes",
    "description": "organize your notes",
}

quiz_function = {
    "name": "quiz",
    "description": "begin quizzing the user on past lecture content",
}

send_files_to_slack = {
    "name": "send_files_to_slack",
    "description": "empty description",
}


schedule_meeting_function = {
    "name": "schedule_meeting",
    "description": "Schedules a meeting with specified attendees at a given time and date.",
    "parameters": {
        "type": "object",
        "properties": {
            "attendees": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of people attending the meeting.",
             },
            "date": {
                "type": "string",
                "description": "Date of the meeting (e.g., '2024-07-29')",
             },
            "time": {
                "type": "string",
                "description": "Time of the meeting (e.g., '15:00')",
            },
            "topic": {
                "type": "string",
                "description": "The subject or topic of the meeting.",
            },
        },
        "required": ["attendees", "date", "time", "topic"],
    },
}



client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
tools = types.Tool(function_declarations=[schedule_meeting_function])
config = types.GenerateContentConfig(tools=[tools])

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
    
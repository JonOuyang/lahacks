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

send_files_to_slack_function = {
    "name": "send_files_to_slack",
    "description": "send specified files to slack",
    "parameters": {
        "type": "object",
        "properties": {
            "file1": {
                "type": "string",
                "description": "List of people attending the meeting.",
             },
            "file2": {
                "type": "string",
                "description": "Date of the meeting (e.g., '2024-07-29')",
             },
        },
        "required": ["file1", "file2"],
    },
}

schedule_meetings_function = {
    "name": "schedule_meetings",
    "description": "schedule a meeting on google calander on behalf of user",
    "parameters": {
        "type": "object",
        "properties": {
            "date": {
                "type": "string",
                "description": "in the format month/date/year",
             },
            "time_start": {
                "type": "string",
                "description": "time that the meeting starts at, in the format hour:minute AM/PM",
             },
            "time_end": {
                "type": "string",
                "description": "time that the meeting ends at, in the format hour:minute AM/PM",
             },
        },
        "required": ["date", "time"],
    },
}


def orchestrator_call(prompt):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    tools = types.Tool(function_declarations=[complete_homework_function, edit_jupyter_function, organize_notes_function, quiz_function, send_files_to_slack_function, schedule_meetings_function])
    config = types.GenerateContentConfig(tools=[tools])

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
    
    if response.candidates[0].content.parts[0].function_call:
        function_call = response.candidates[0].content.parts[0].function_call
        print(f"Function to call: {function_call.name}")
        print(f"Arguments: {function_call.args}")
        #  In a real app, you would call your function here:
        #  result = schedule_meeting(**function_call.args)
    else:
        print("<No function call found in the response.>")
        print(response.text)

if __name__ == "__main__":
    orchestrator_call('Can you quickly quiz me on all of my lecture contents in the past year?')
    
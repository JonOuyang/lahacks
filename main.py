import os
import sys
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types
import base64
import datetime

# Load API keys
load_dotenv()

# FUNCTION IMPORTS
from agent_functions.homework import complete_homework
from agent_functions.jupyter import edit_jupyter
from agent_functions.organize_notes import organize_notes
from agent_functions.quiz import quiz
from agent_functions.slack import send_files_to_slack, schedule_meetings
from audio.audio import tts

# FUNCTION DECLARATIONS
speak_function = {
    "name": "tts",
    "description": "give verbal feedback to user in the form of text to speech",
    "parameters": {
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "text to be spoken to the user. This will go through a TTS API"
            }
        }
    }
}

complete_homework_function = {
    "name": "complete_homework",
    "description": "empty description",
    "parameters": {
        "type": "object",
        "properties": {
            "files": {
                "type": "string",
                "description": "file ",
             },
        },
        "required": ["files"],
    },
}

edit_jupyter_function = {
    "name": "edit_jupyter",
    "description": "open the jupyter notebook file and begin editing it",
    "parameters": {
        "type": "object",
        "properties": {
            "files": {
                "type": "string",
                "description": "file ",
             },
        },
        "required": ["files"],
    },
}

organize_notes_function = {
    "name": "organize_notes",
    "description": "organize your notes",
    "parameters": {
        "type": "object",
        "properties": {
            "files": {
                "type": "string",
                "description": "file ",
             },
        },
        "required": ["files"],
    },
}

quiz_function = {
    "name": "quiz",
    "description": "begin quizzing the user on past lecture content",
    "parameters": {
        "type": "object",
        "properties": {
            "files": {
                "type": "string",
                "description": "file ",
             },
        },
        "required": ["files"],
    },
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
        "required": ["date", "time_start", "time_end"],
    },
}


def orchestrator_call(prompt):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    tools = types.Tool(function_declarations=[speak_function,
                                              complete_homework_function, 
                                              edit_jupyter_function, 
                                              organize_notes_function, 
                                              quiz_function, 
                                              send_files_to_slack_function, 
                                              schedule_meetings_function
                                              ])
    config = types.GenerateContentConfig(tools=[tools])

    model = "gemini-2.5-flash-preview-04-17"
    
    model_prompt = f"""
        You are a hyperintelligent agentic system with a sense of humor. You will speak naturally and keep responses short, as if you were talking to me in person. Nobody likes a yapper.
        You will do everything in your power to address the user's prompt. If you have enough information, use the given functions to perform certain tasks. You may make reasonable assumptions.
        If you require more information, prompt the user to give you more information to work with.
        For your reference, the current date and time as of this LLM call is: {datetime.datetime.now()}
        
        User's prompt: {prompt}
        
        You must NEVER output plain text. You must ALWAYS use a function call. Either to express yourself or execute an action.
    """
    
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=model_prompt),
            ],
        ),
    ]

    # for chunk in client.models.generate_content_stream(
    #     model=model,
    #     contents=contents,
    #     config=generate_content_config,
    # ):
    #     print(chunk.text, end="")
    
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=config
    )
    
    if response.candidates[0].content.parts[0].function_call:
        function_call = response.candidates[0].content.parts[0].function_call
        
        print(f"Function to call: {function_call.name}")
        print(f"Arguments: {function_call.args}")
        
        if function_call.name == "tts":
            tts(**function_call.args)
        elif function_call.name == "complete_homework":
            complete_homework(**function_call.args)
        elif function_call.name == "edit_jupyter":
            edit_jupyter(**function_call.args)
        elif function_call.name == "organize_notes":
            organize_notes(**function_call.args)
        elif function_call.name == "quiz":
            quiz(**function_call.args)
        elif function_call.name == "send_files_to_slack":
            send_files_to_slack(**function_call.args)
        elif function_call.name == "schedule_meetings":
            schedule_meetings(**function_call.args)

    else:
        print("<No function call found in the response.>")
        print(response.text)

if __name__ == "__main__":
    orchestrator_call('tell me a joke')
    
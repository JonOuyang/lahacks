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
from agent_functions.calendar_utils import display_events, book_meeting
from agent_functions.homework import complete_homework
from agent_functions.jupyter import edit_jupyter
from agent_functions.linkd import search_linkd
from agent_functions.organize_notes import organize_notes
from agent_functions.quiz import quiz
from agent_functions.slack import send_files_to_slack
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
    "description": "open the jupyter notebook file and begin editing it based on a user's prompt",
    "parameters": {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "Instruction on how to modify the Jupyter notebook content.",
             },
        },
        "required": ["prompt"],
    },
}

search_linkd_function = {
    "name": "search_linkd",
    "description": "search through a massive database of alumni to find people who match certain keywords",
    "parameters": {
        "type": "object",
        "properties": {
            "limit": {
                "type": "string",
                "description": "string representation of integer number of query results (default to 5 unless otherwise specified). Examples could be 5, 10, 20, 30...",
             },
            "query": {
                "type": "string",
                "description": "keywords to search alumni for; i.e. 'Robotics Researchers' or 'Startup Founders'",
             },
            "school": {
                "type": "string",
                "description": "School of alumni to be searched for. If not specified, default to the University of California, Los Angeles (UCLA)",
             },
        },
        "required": ["limit", "query", "school"],
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

display_events_function = {
    "name": "display_events",
    "description": "fetch the last n number of events",
    "parameters": {
        "type": "object",
        "properties": {
            "n": {
                "type": "integer",
                "description": "Number of events to fetch from calender (if not specified, default to 10)",
             },
        },
        "required": ["n"],
    },
}

book_meeting_function = {
    "name": "book_meeting",
    "description": "schedule a meeting on google calander on behalf of user",
    "parameters": {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "The title of the meeting, what appears at the top of the invitation. This should be at most a few words long.",
             },
            "location": {
                "type": "string",
                "description": "Location of the meeting. If not specified, default to online (Google Meeting)",
             },
            "description": {
                "type": "string",
                "description": "Longer form description of what this email is about. If not specified, default to 'coffee chat'",
             },
            "startTime": {
                "type": "string",
                "description": "Start time of meeting, represented similar to 2025-04-28T10:00:00-07:00 format, in PST (Los Angeles) time.",
             },
            "endTime": {
                "type": "string",
                "description": "End time of meeting, represented similar to 2025-04-28T09:00:00-07:00 format, in PST (Los Angeles) time. If not specified, default to 1 hour after start time",
             },
        },
        "required": ["summary", "location", "description", "startTime", "endTime"],
    },
}

def orchestrator_call(prompt):
    notebook_path = "/Users/ericzhou03/Desktop/original-iris-classification.ipynb"
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    tools = types.Tool(function_declarations=[speak_function,
                                              complete_homework_function, 
                                              edit_jupyter_function, 
                                              search_linkd_function,
                                              organize_notes_function, 
                                              quiz_function, 
                                              send_files_to_slack_function,
                                              display_events_function, 
                                              book_meeting_function
                                              ])
    config = types.GenerateContentConfig(tools=[tools])

    model = "gemini-2.5-flash-preview-04-17"
    
    model_prompt = f"""
        You are a hyperintelligent agentic system with a sense of humor. You will speak naturally and keep responses short, as if you were talking to me in person. Nobody likes a yapper.
        You will do everything in your power to address the user's prompt. If you have enough information, use the given functions to perform certain tasks. You may make reasonable assumptions.
        If you require more information, prompt the user to give you more information to work with.
        For your reference, the current date and time as of this LLM call is: {datetime.datetime.now()}
        
        User's prompt: {prompt}
        
        You must NEVER output plain text. You must ALWAYS use a function call. Either to express yourself or execute an action. When calling functions, assume that ALL parameters are MANDATORY (REQUIRED).
        Answering the prompt is your top priority. You must ALWAYS prioritize function calling in order to gather information or execute tasks BEFORE function calling to output using tts()
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
            # FORCE the hardcoded path
            edit_jupyter(file_path=notebook_path, prompt=function_call.args.get("files", ""))
        elif function_call.name == "organize_notes":
            organize_notes(**function_call.args)
        elif function_call.name == "quiz":
            quiz(**function_call.args)
        elif function_call.name == "send_files_to_slack":
            send_files_to_slack(**function_call.args)
        elif function_call.name == "book_meeting":
            book_meeting(**function_call.args)
        elif function_call.name == "display_events":
            display_events(**function_call.args)
        elif function_call.name == "search_linkd":
            search_linkd(**function_call.args)

    else:
        print("<No function call found in the response.>")
        print(response.text)
    

if __name__ == "__main__":
    orchestrator_call('can you look up the most famous CS alumni from UCLA?')
    
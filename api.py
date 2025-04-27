from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import time
import threading

from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load API keys
load_dotenv()

# FUNCTION IMPORTS
from agent_functions.homework import complete_homework
from agent_functions.jupyter import edit_jupyter
from agent_functions.organize_notes import organize_notes
from agent_functions.quiz import quiz
from agent_functions.slack import send_files_to_slack, schedule_meetings

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/agent', methods=['POST'])
def agent_endpoint():
    data = request.json
    prompt = data.get('prompt', '')
    
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    
    try:
        # Configure the AI client
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        # Define the available functions
        tools = types.Tool(function_declarations=[
            {
                "name": "complete_homework",
                "description": "empty description",
            },
            {
                "name": "edit_jupyter",
                "description": "open the jupyter notebook file and begin editing it",
            },
            {
                "name": "organize_notes",
                "description": "organize your notes",
            },
            {
                "name": "quiz",
                "description": "begin quizzing the user on past lecture content",
            },
            {
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
            },
            {
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
        ])
        
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
        
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config
        )
        
        result = {}
        
        # Process function calls if present
        if response.candidates and response.candidates[0].content.parts and hasattr(response.candidates[0].content.parts[0], 'function_call'):
            function_call = response.candidates[0].content.parts[0].function_call
            result = {
                "type": "function",
                "function": function_call.name,
                "args": function_call.args,
                "message": f"Function to call: {function_call.name} with arguments: {function_call.args}"
            }
            
            # Execute the function based on the name
            if function_call.name == "complete_homework":
                result["result"] = complete_homework()
            elif function_call.name == "edit_jupyter":
                result["result"] = edit_jupyter()
            elif function_call.name == "organize_notes":
                result["result"] = organize_notes()
            elif function_call.name == "quiz":
                result["result"] = quiz()
            elif function_call.name == "send_files_to_slack":
                result["result"] = send_files_to_slack(function_call.args.get("file1"), function_call.args.get("file2"))
            elif function_call.name == "schedule_meetings":
                result["result"] = schedule_meetings(
                    function_call.args.get("date"), 
                    function_call.args.get("time_start"), 
                    function_call.args.get("time_end")
                )
        else:
            # Return the text response if no function call
            result = {
                "type": "text",
                "message": response.text
            }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)

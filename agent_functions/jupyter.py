"""
Edits a Jupyter notebook file based on a prompt and executes the tweaked cells.
"""

import nbformat
from nbconvert.preprocessors import ExecutePreprocessor
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def edit_jupyter(file_path: str, prompt: str):
    # Load the notebook
    with open(file_path, "r", encoding="utf-8") as f:
        notebook = nbformat.read(f, as_version=4)

    # Initialize Gemini API client
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    model = "gemini-2.5-flash-preview-04-17"

    # Send the prompt to Gemini API
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(response_mime_type="text/plain"),
    )

    # Extract the suggested edits from the response
    if response.candidates and response.candidates[0].content.parts[0].text:
        suggested_edits = response.candidates[0].content.parts[0].text
        print(f"Suggested edits: {suggested_edits}")
    else:
        print("No suggested edits found.")
        return

    # Apply the edits to the notebook
    for cell in notebook.cells:
        if cell.cell_type == "code" and "specific marker" in cell.source:
            cell.source += f"\n# Suggested edit:\n{suggested_edits}"

    # Save the modified notebook
    with open(file_path, "w", encoding="utf-8") as f:
        nbformat.write(notebook, f)

    # Execute the modified notebook
    ep = ExecutePreprocessor(timeout=600, kernel_name="python3")
    try:
        ep.preprocess(notebook, {"metadata": {"path": "./"}})
        print("Notebook executed successfully.")
    except Exception as e:
        print(f"Error during execution: {e}")
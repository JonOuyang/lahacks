"""
Edits a Jupyter notebook file based on a prompt and executes the tweaked cells.
"""

import nbformat
from nbconvert.preprocessors import ExecutePreprocessor
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import jupyter_client

# Load environment variables
load_dotenv()

def edit_jupyter(file_path: str, prompt: str):
    # Load the notebook
    with open(file_path, "r", encoding="utf-8") as f:
        notebook = nbformat.read(f, as_version=4)

    # Initialize Gemini API client
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    model = "gemini-2.5-flash-preview-04-17"

    prompt += "I will give you each cell in the Jupyter notebook one by one separated by '###'. " \
             "Please return just the modified code for each cell and separate them by '###'. " \
             "If you don't want to make any changes, please return the original code. " \
             "Please do not add any comments or explanations. Just return the code."
    for i, cell in enumerate(notebook.cells):
        if cell.cell_type == "code":
            prompt += f"\n###\n{cell.source}"
    prompt += "\n###"

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

    full_modified_code = response.candidates[0].content.parts[0].text
    per_cell_modified_code = full_modified_code.split("###")

    # Apply the edits to the notebook
    idx = 0
    for i, cell in enumerate(notebook.cells):
        if cell.cell_type == "code":
            if idx < len(per_cell_modified_code): cell.source = per_cell_modified_code[idx].strip().removeprefix("```python\n").removesuffix("\n```")
            else: cell.source = cell.source.strip()
            idx += 1

    # Save the modified notebook
    with open(file_path, "w", encoding="utf-8") as f:
        nbformat.write(notebook, f)

    # Update the kernel to match the current environment
    kernel_manager = jupyter_client.KernelManager()
    kernel_manager.start_kernel()
    kernel_name = kernel_manager.kernel_name
    kernel_manager.shutdown_kernel()

    notebook.metadata.kernelspec = {
        "name": kernel_name,
        "display_name": kernel_name,
        "language": "python",
    }

    # Execute only the modified cells
    ep = ExecutePreprocessor(timeout=600, kernel_name=kernel_name)
    try:
        ep.preprocess(notebook, {"metadata": {"path": "./"}})
        print("Cells executed successfully.")
    except Exception as e:
        print(f"Error during execution: {e}")

    # Save the executed notebook
    with open(file_path, "w", encoding="utf-8") as f:
        nbformat.write(notebook, f)

if __name__ == "__main__":
    notebook_path = "../research-ml-models/iris-classification.ipynb"
    user_prompt = "Replace the Random Forest classifier with a Decision Tree classifier."
    edit_jupyter(notebook_path, user_prompt)
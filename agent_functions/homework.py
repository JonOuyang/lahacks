"""
Reads or writes homework questions/answers in a Google Doc using Gemini.
"""

from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaFileUpload
from google.oauth2.credentials import Credentials
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def complete_homework(doc_id: str, user_prompt: str):
    # Authenticate with Google Docs API
    creds = Credentials.from_authorized_user_file('token.json', ['https://www.googleapis.com/auth/documents'])
    service = build('docs', 'v1', credentials=creds)

    # Fetch the document content
    document = service.documents().get(documentId=doc_id).execute()
    content = document.get('body', {}).get('content', [])

    # Extract text from the document
    doc_text = ""
    for element in content:
        if 'paragraph' in element:
            for text_run in element['paragraph'].get('elements', []):
                if 'textRun' in text_run:
                    doc_text += text_run['textRun']['content']

    # Use Gemini to determine the mode and perform the task
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    model = "gemini-2.5-flash-preview-04-17"

    # Unified prompt for Gemini
    prompt = f"The user provided the following prompt:\n\n{user_prompt}\n\n" \
             f"Here is the homework text:\n\n{doc_text}\n\n" \
             f"Determine whether the task is to extract questions or provide answers. " \
             f"If the task is to extract a question, start the response with 'Question:' and return the last question that the user has not answered on the homework text." \
             f"If the task is to fill in an answer, start the response with 'Answer:' and return the user-provided answer."

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
    result = response.candidates[0].content.parts[0].text

    if result.startswith("Question: "):
        # Extract the question
        question = result[len("Question: "):].strip()
        return question
    elif result.startswith("Answer:"):
        # Fill in the answer
        answer = result[len("Answer: "):].strip()

        # Append the result to the Google Doc
        requests = [
            {
                'insertText': {
                    'location': {
                        'index': document.get('body').get('content')[-1].get('endIndex') - 1,
                    },
                    'text': f"\n{answer}"
                }
            }
        ]
        service.documents().batchUpdate(documentId=doc_id, body={'requests': requests}).execute()
        return "Answer added to the document."

if __name__ == "__main__":
    doc_id = "1Z_PHcuVLfis0VVOyq3s4z7Ijo9fj5JrL2c5u78aHDLo"
    user_prompt = "For the last question, fill in the answer: The Emancipation Proclamation discouraged European nations from recognizing or aiding the Confederacy."
    complete_homework(doc_id, user_prompt)
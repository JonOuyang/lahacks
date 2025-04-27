# Study Companion AI Assistant

As UCLA students, it takes us almost 20 minutes to walk to class from our dorms. This time adds up, meaning at the very least, we spend a minimum of an hour of our day every day just walking. This is valuable time just wasted, spent on walking.

What if we could be productive and reclaim these lost hours during our day?

## Project Structure

This project consists of several components:

- **Python AI Agent Backend**: Provides AI-powered functionality for completing homework, organizing notes, quizzing students, and more
- **Web Application**: A modern Next.js frontend with a beautiful UI for interacting with the AI agent
- **Telegram Bot**: For mobile access to the AI assistant

## Directory Structure

- `/agent_functions/` - Contains the Python functions for different AI assistant capabilities
- `/api.py` - Flask API server that connects the frontend to the AI backend
- `/frontend/` - Next.js web application with a modern UI
- `/teleBot/` - Telegram bot implementation
- `/main.py` - Original command-line interface to the AI system

## Setup Instructions

### Backend Setup

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up your environment variables (create a `.env` file in the root directory):
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Start the API server:
   ```
   python api.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application


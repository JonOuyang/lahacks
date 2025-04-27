# Sir Syncs A Lot
Unifying Productivity Across Devices

# Overview
As UCLA students, we routinely spend nearly 20 minutes walking each way between our dorms and classes — totaling over an hour of lost time daily. Time that could have been used to study, complete assignments, or pursue personal projects is instead consumed by transit.

Sir Syncs A Lot is our solution to reclaiming these lost hours. We introduce a unified AI system that empowers students to access and control their computers remotely via mobile devices, enabling them to stay productive even during their everyday commutes.

Whether you want to modify machine learning notebooks, complete homework assignments, manage your schedule, or brainstorm project ideas — Sir Syncs A Lot enables seamless, intelligent interaction with your desktop environment through a simple mobile interface.

# ✨ Key Features
* AI-Powered Productivity Agent:
Complete assignments, review notes, and tackle quizzes with an intelligent AI assistant trained for academic support.

* Remote Desktop Orchestration:
Initiate and manage complex computing tasks — from training ML models to file management — directly through text commands.

* Cross-Platform Access:
Communicate with your AI agent via a Telegram chatbot or a modern web application designed for intuitive use.

* Extendable Modular Design:
Specialized function modules handle tasks independently under the guidance of a centralized orchestrator, ensuring scalability and reliability.

## 🏗️ Project Structure
This project consists of multiple coordinated components:

* Python AI Backend
     * Core agent logic
     * Specialized function modules (homework solver, quiz master, note organizer)

* Next.js Web Frontend
     * Responsive, modern web interface
     * Designed for seamless desktop or mobile browser access

* Telegram Bot Interface
     * Lightweight mobile gateway
     * Provides real-time interaction with the AI agent over Telegram

# 📁 Directory Structure
```bash
Copy
Edit
/agent_functions/    # Python modules for different AI capabilities
/api.py              # Flask API server that bridges frontend and backend
/frontend/           # Next.js web application for the user interface
/teleBot/            # Telegram bot implementation for mobile communication
/main.py             # CLI interface to directly interact with the AI system
```
# ⚙️ Setup Instructions
## Backend Setup
1. Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Mac/Linux
venv\Scripts\activate     # On Windows
```
2. Install Python dependencies:

```bash
pip install -r requirements.txt
```
3. Configure environment variables:
Create a .env file in the project root with the following content:

```plaintext
GEMINI_API_KEY="your_api_key_here"
ELEVENLABS_URL="your_elevenlabs_url_here"
ELEVENLABS_API_KEY="your_api_key_here"
```
Start the API server:

```bash
python api.py
```
## Frontend Setup
1. Navigate to the frontend directory:

```bash
cd frontend
```
2. Install frontend dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```
3. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open http://localhost:3000 in your browser to view the application.

# 🛣️ Future Roadmap
* Expand AI agent capabilities to support code review and debugging
* Add a secure authentication layer for all remote commands
* Integrate push notifications for task completions
* Introduce multi-device session syncing
* Deploy cloud-hosted API and frontend for universal remote access

# 🚀 Vision
Sir Syncs A Lot reimagines what mobile productivity can look like.
We believe students should be empowered to turn every step — every walk across campus — into an opportunity for creation, learning, and growth.

Our goal is to create a future where your productivity is no longer bound to your desk, but follows you wherever you go.


# AURA

AURA is an enterprise AI knowledge platform designed for European banking workflows. It includes a beautiful React + TypeScript frontend, a FastAPI + SQLite backend, and a role-based experience featuring specialized AI agents for KYC, AML, Compliance, and Payments workflows.

## Features

- **Domain Experts**: Pre-configured specialized AI agents for KYC, AML, Compliance, and Payments workflows.
- **Admin Workspace (Governance)**: Manage expert agents, upload policies, and track knowledge health and usage adoption.
- **AI Workspace**: A modern, full-height chat interface with real-time streaming, auto-scrolling, and transparent document citations.
- **Dynamic Confidence & Feedback Loop**: Agents display real-time confidence scores based on their health metrics. Users can rate responses (Helpful / Not Helpful) to dynamically adjust an agent's confidence score over time.
- **Role-Based Access Control & Routing**: Secure protected routes that seamlessly redirect unauthenticated users to the Login screen, and route authenticated users to their appropriate Workspace or Admin Dashboard.
- **Local AI Inference (Ollama)**: Full support for 100% free, private, offline AI inference using local models like `llama3` for chat and `nomic-embed-text` for RAG document embeddings.
- **Premium Aesthetics**: Built with Framer Motion and TailwindCSS featuring glassmorphism, dynamic animations, deep slate backgrounds, and neon accents.

## Project Structure

- `frontend/` - Vite + React + TypeScript application
- `backend/app/` - FastAPI backend, SQLite database logic, and API routes
- `backend/Dockerfile` - Production configuration for Google Cloud Run
- `frontend/firebase.json` - Production configuration for Firebase Hosting

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (or 3.11+)
- `gcloud` CLI and `firebase` CLI (Required only for Google Cloud Deployment)

---

## Local Development Setup

To run AURA locally, you need to start both the frontend development server and the backend API.

### 1. Start the Backend API

The backend uses FastAPI and stores data locally in a SQLite database (`aura.db`).

```bash
cd backend

# Create a virtual environment and activate it
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start the API server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be available at `http://localhost:8000`.

### 2. Start the Frontend App

Open a **new terminal window**.

```bash
cd frontend

# Install packages
npm install

# Start the dev server
npm run dev
```
The frontend will be available at `http://localhost:5173`. 

### Login Instructions
- **Admin Access**: Use any username that does *not* contain the word "expert" and any password. (e.g., `admin` / `admin123`). This grants access to the Dashboard, Analytics, and Governance views.
- **Expert Access**: Use a username containing "expert" (e.g., `expertuser` / `password`). This restricts access primarily to the AI Workspace.

---

## Deploying to Google Cloud Platform (GCP)

AURA is designed to be deployed as a decoupled application. The backend will be hosted on **Google Cloud Run** and the frontend on **Firebase Hosting**.

*Note: For a production-ready system, you should replace the local SQLite database with Google Cloud SQL (PostgreSQL). The following instructions deploy AURA as a "stateless prototype", meaning the local database will reset whenever the Cloud Run instance sleeps due to inactivity.*

### Prerequisites for Deployment
1. Ensure you have the Google Cloud CLI installed (`gcloud auth login`).
2. Ensure you have the Firebase CLI installed (`npm install -g firebase-tools` and `firebase login`).
3. Ensure you have a Google Cloud Project with billing enabled.
4. Enable the required GCP APIs:
   ```bash
   gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com run.googleapis.com
   ```

### Step 1: Deploy the Backend to Cloud Run

The backend includes a `Dockerfile` that packages the FastAPI server.

1. Open your terminal and navigate to the `backend` folder.
2. Set your active GCP project (replace `YOUR_PROJECT_ID`):
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Deploy the service:
   ```bash
   gcloud run deploy aura-backend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 1024Mi
   ```
4. **Important**: When the deployment succeeds, the console will output a **Service URL** (e.g., `https://aura-backend-xyz.run.app`). **Copy this URL**.

### Step 2: Build the Frontend

The React frontend needs to know where the backend API lives. We pass this via an environment variable during the build step.

1. Navigate to the `frontend` folder.
2. Set the environment variable using the URL you copied from Step 1, and run the build command.

**On Windows (PowerShell):**
```powershell
$env:VITE_API_BASE_URL="https://YOUR-CLOUD-RUN-URL.run.app"
npm run build
```

**On Mac/Linux:**
```bash
export VITE_API_BASE_URL="https://YOUR-CLOUD-RUN-URL.run.app"
npm run build
```

This generates a `dist/` folder containing your static production website.

### Step 3: Deploy the Frontend to Firebase

1. Initialize Firebase in the `frontend` directory:
   ```bash
   firebase init hosting
   ```
   - **Select** your existing Google Cloud Project.
   - **Public directory**: `dist`
   - **Single-page app**: `Yes`
   - **Overwrite index.html**: `No`

2. Deploy the site:
   ```bash
   firebase deploy --only hosting
   ```

When complete, Firebase will provide you with a live Hosting URL (e.g., `https://your-project.web.app`). AURA is now live on the internet!

---

## Local AI Inference (Ollama Support)

By default, AURA uses a mock simulated response when running locally without API keys. You can configure AURA to use **Google Gemini** for cloud deployments, or **Ollama** for completely free, local, open-source AI inference.

### Setting up Ollama
1. Download and install [Ollama](https://ollama.com/).
2. Pull the required models in your terminal:
   ```bash
   ollama pull llama3             # For chat generation
   ollama pull nomic-embed-text   # For document embeddings (RAG)
   ```

### Running AURA with Ollama
Before starting the backend server, set the `USE_OLLAMA` environment variable.

**On Windows (PowerShell):**
```powershell
$env:USE_OLLAMA="true"
$env:OLLAMA_CHAT_MODEL="llama3"
$env:OLLAMA_EMBED_MODEL="nomic-embed-text"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**On Mac/Linux:**
```bash
export USE_OLLAMA="true"
export OLLAMA_CHAT_MODEL="llama3"
export OLLAMA_EMBED_MODEL="nomic-embed-text"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

*Warning: If you switch from Gemini to Ollama (or vice versa), the vector dimensions of the embeddings will change. You must delete the local `aura.db` file and restart the server to regenerate the document chunks using the new model!*
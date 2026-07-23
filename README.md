# OmniMind

OmniMind is a knowledge AI platform designed for European banking workflows. It includes a beautiful React + TypeScript frontend, a FastAPI + SQLite backend, and a role-based experience featuring specialized AI agents for KYC, AML, Compliance, and Payments workflows.

## Features

- **Domain Experts**: Pre-configured specialized AI agents for KYC, AML, Compliance, and Payments workflows.
- **Admin Workspace (Governance)**: Manage expert agents, upload policies, and track knowledge health and usage adoption.
- **AI Workspace**: A modern, full-height chat interface with real-time streaming, auto-scrolling, and transparent document citations.
- **Dynamic Confidence & Feedback Loop**: Agents display real-time confidence scores based on their health metrics. Users can rate responses (Helpful / Not Helpful) to dynamically adjust an agent's confidence score over time.
- **Asynchronous Document Processing**: Built with FastAPI BackgroundTasks and multithreading, OmniMind seamlessly handles massive document uploads and vector embeddings without blocking or timing out the user interface.
- **Document Management**: Admins have full control over the knowledge base, complete with dynamic visual processing states (Processing, Approved, Failed) and document deletion capabilities.
- **Role-Based Access Control & Routing**: Secure protected routes that seamlessly redirect unauthenticated users to the Login screen, and route authenticated users to their appropriate Workspace or Admin Dashboard.
- **Premium Aesthetics**: Built with Framer Motion and TailwindCSS featuring glassmorphism, dynamic animations, deep slate backgrounds, and neon accents.

## Application Overview and Architecture

OmniMind (AURA) follows a decoupled, modular client-server architecture designed for high scalability, real-time AI interactivity, and absolute data privacy. It is composed of three main layers:

### 1. Presentation Layer (Frontend)
- **Framework:** React + TypeScript + Vite for ultra-fast builds and type-safe development.
- **Styling & UI:** TailwindCSS combined with Framer Motion for a premium, glassmorphism-inspired aesthetic with dynamic micro-animations.
- **Routing:** React Router drives the single-page application (SPA), featuring route guards that separate the user-facing **AI Workspace** from the governance-focused **Admin Dashboard**.
- **Real-Time UX:** Uses Server-Sent Events (SSE) to consume streaming tokens from the backend, providing a smooth, ChatGPT-like typing experience.

### 2. Application & API Layer (Backend)
- **Framework:** FastAPI (Python) provides a lightning-fast, highly concurrent ASGI web server.
- **Asynchronous Processing:** Heavy operations like document parsing, chunking, and vector embedding are offloaded to FastAPI BackgroundTasks to ensure the UI remains instantly responsive.
- **Document Ingestion Pipeline:** Natively supports PDF, DOCX, and URL web-scraping using `pypdf`, `python-docx`, and `BeautifulSoup`.

### 3. Data & Intelligence Layer
- **Relational Database:** Managed via SQLAlchemy. Defaults to SQLite for immediate local setup, with native support for PostgreSQL (via `psycopg2`) for enterprise deployments.
- **Vector Database:** Local vector storage for Retrieval-Augmented Generation (RAG) embeddings.
- **LLM Engine Options:**
  - **Cloud AI (Vertex AI):** Integration with Google Cloud Vertex AI (`gemini-3.5-flash`, `text-embedding-004`) using Application Default Credentials for secure, keyless access.

## Project Structure

- `frontend/` - Vite + React + TypeScript application
- `backend/app/` - FastAPI backend, SQLite database logic, and API routes
- `backend/Dockerfile` - Production configuration for Google Cloud Run
- `frontend/firebase.json` - Production configuration for Firebase Hosting

## API Endpoints

The FastAPI backend exposes 15 distinct API endpoints to power the application:

### 🧠 Agents API (`/agents`)
- `GET /agents` - Fetch all expert agents
- `POST /agents` - Create a new expert agent
- `DELETE /agents/{agent_id}` - Delete an expert agent

### 📄 Documents API (`/documents`)
- `GET /documents` - List all uploaded documents
- `POST /documents` - Create a document record
- `POST /documents/upload` - Upload a physical file (e.g., PDF) and process it for RAG
- `POST /documents/url` - Ingest knowledge from a web URL
- `DELETE /documents/{doc_id}` - Delete a document and its vector embeddings

### 💬 Chat API (`/chat`)
- `POST /chat` - Standard (synchronous) chat with an expert agent
- `POST /chat/stream` - Real-time streaming chat endpoint (SSE)
- `POST /chat/{message_id}/feedback` - Submit helpful/not-helpful feedback on an answer

### 📊 Dashboard API (`/dashboard`)
- `GET /dashboard/stats` - Get top-level dashboard metrics
- `GET /dashboard/recent-uploads` - Get the latest document uploads for the feed
- `GET /dashboard/recent-activity` - Get the recent system activity feed

### 🌐 Root/System
- `GET /` - Healthcheck endpoint to verify the API is running

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (or 3.11+)
- `gcloud` CLI and `firebase` CLI (Required only for Google Cloud Deployment)

---

## Local Development Setup

To run OmniMind locally, you need to start both the frontend development server and the backend API.

### 1. Start the Backend API

The backend uses FastAPI and stores data locally in a SQLite database (`omnimind.db`).

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
- **Single Sign-On (SSO)**: The application UI provides Single Sign-On options for Microsoft Entra and Google Authentication (currently configured as UI placeholders for the demo environment).

---

## Deploying to Google Cloud Platform (GCP)

OmniMind is designed to be deployed as a decoupled application. The backend will be hosted on **Google Cloud Run** and the frontend on **Firebase Hosting**.

*Note: For a production-ready system, you should replace the local SQLite database with Google Cloud SQL (PostgreSQL). The following instructions deploy OmniMind as a "stateless prototype", meaning the local database will reset whenever the Cloud Run instance sleeps due to inactivity.*

### Prerequisites for Deployment
1. Ensure you have the Google Cloud CLI installed.
2. Authenticate with Google Cloud and set up your Application Default Credentials (ADC) for Vertex AI:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```
3. Ensure you have the Firebase CLI installed (`npm install -g firebase-tools` and `firebase login`).
4. Ensure you have a Google Cloud Project with billing enabled, and the Vertex AI API enabled.
5. Enable the required GCP APIs:
   ```bash
   gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com run.googleapis.com aiplatform.googleapis.com
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
   gcloud run deploy omnimind-backend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 1024Mi
   ```
4. **Important**: When the deployment succeeds, the console will output a **Service URL** (e.g., `https://omnimind-backend-xyz.run.app`). **Copy this URL**.

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

When complete, Firebase will provide you with a live Hosting URL (e.g., `https://your-project.web.app`). OmniMind is now live on the internet!

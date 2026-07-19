# Orcific Minutes

> An offline-first AI meeting assistant that turns plain-text transcripts into structured notes, searchable meeting history, and PDF or Markdown exports.

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Ollama](https://img.shields.io/badge/Ollama-Local_AI-black)

## Overview

- Generates a summary, decisions, action items, and open questions from a transcript.
- Stores meeting notes and transcript chunks in SQLite.
- Supports semantic search and RAG questions over saved meetings.
- Exports notes as Markdown or PDF.
- Runs locally with Ollama; no cloud AI key is required.

---

## Features

### AI Features

- Local LLM inference
- Structured JSON extraction
- Prompt engineering
- Multiple model selection
- Response metrics

### Meeting Management

- Upload transcript
- Generate meeting notes
- Save meetings
- Meeting history
- SQLite persistence

### Export

- Copy to clipboard
- Markdown export
- PDF export

### Retrieval-Augmented Generation (RAG)

- Transcript chunking
- Embedding generation
- Semantic search
- Context injection
- AI-powered question answering

---

## Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- Vite

### Backend

- Java 21
- Spring Boot
- Maven
- SQLite

### AI

- Ollama
- Qwen2.5
- Gemma 3 4B
- Phi-3 Mini

---
<!--
## Run it with Docker (still fixing)
-->
### Prerequisites

```bash
git clone https://github.com/rojerm2/orcific-minutes-ai
cd orcific-minutes
docker compose up --build
```
<!--
Open [http://localhost:5173](http://localhost:5173). The first start downloads the chat and embedding models, so it can take several minutes. Later starts reuse the Docker volumes.
-->

## Run it without Docker (recommended)

Requirements: Java 21, Node.js 22 or newer, and [Ollama](https://ollama.com/).

```bash
# Terminal 1: download and start the local AI runtime
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
ollama serve

# Terminal 2: backend
cd core
./mvnw spring-boot:run

# Terminal 3: frontend
cd web/orcific-minutes-ui
npm ci
npm run dev
```

On Windows PowerShell, use `./mvnw.cmd spring-boot:run` and `npm.cmd` if PowerShell blocks the `npm.ps1` script.

## Configuration

<!--
The frontend uses `/api` by default. During local Vite development, that path is proxied to `http://localhost:8080`; in Docker, Nginx proxies it to the backend container. This means no code edit is needed between those two modes.


For a separately hosted frontend, set `VITE_API_BASE_URL` **at build time** to your backend URL ending in `/api`, for example `https://api.example.com/api`. Set `CORS_ALLOWED_ORIGINS` on the backend to the browser origin, for example `https://demo.example.com`.

Copy `.env.example` to `.env` only if you want to change the default Ollama model names or CORS settings. Never commit `.env`.
-->

| Variable                 | Default                               | Purpose                                                     |
| ------------------------ | ------------------------------------- | ----------------------------------------------------------- |
| `OLLAMA_CHAT_MODEL`      | `qwen2.5:3b`                          | Model selected for initial Docker download.                 |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text`                    | Model used for semantic search embeddings.                  |
| `OLLAMA_BASE_URL`        | `http://localhost:11434`              | Ollama address used by a locally run backend.               |
| `SPRING_DATASOURCE_URL`  | `jdbc:sqlite:./data/meeting-notes.db` | SQLite data location.                                       |
| `CORS_ALLOWED_ORIGINS`   | `http://localhost:5173`               | Comma-separated origins permitted to call the API directly. |

## Architecture

Backend Architecture
```text
.
└── backend/
    ├── java/
    │   ├── controller/
    │   │   ├── MeetingController
    │   │   └── RagController
    │   ├── config/
    │   │   ├── CorsConfig
    │   │   └── RestClientConfig
    │   ├── dto/
    │   │   ├── ai/
    │   │   │   ├── EmbeddingRequest
    │   │   │   ├── EmbeddingResponse
    │   │   │   ├── OllamaOptions
    │   │   │   ├── OllamaRequest
    │   │   │   ├── OllamaResponse
    │   │   │   ├── RagAnswerResponse
    │   │   │   ├── RagQuestionRequest
    │   │   │   └── SearchResult
    │   │   ├── AiResponse
    │   │   ├── ApiError
    │   │   ├── GenerationMetadata
    │   │   ├── MeetingHistoryResponse
    │   │   ├── MeetingNotes
    │   │   ├── MeetingRequest
    │   │   ├── SaveMeetingRequest
    │   │   └── SaveMeetingResponse
    │   ├── entity/
    │   │   ├── MeetingChunkEntity
    │   │   └── MeetingEntity
    │   ├── exception/
    │   │   ├── GlobalExceptionHandler
    │   │   ├── InvalidAiResponseException
    │   │   ├── MeetingProcessingException
    │   │   └── OllamaCommunicationException
    │   ├── mapper/
    │   │   └── MeetingMapper
    │   ├── repository/
    │   │   ├── MeetingChunkRepository
    │   │   └── MeetingRepository
    │   ├── service/
    │   │   ├── ai/
    │   │   │   ├── ChunkingService
    │   │   │   ├── EmbeddingService
    │   │   │   ├── OllamaService
    │   │   │   ├── PromptService
    │   │   │   ├── RagService
    │   │   │   ├── RetrievalService
    │   │   │   └── SimilarityService
    │   │   ├── MeetingService
    │   │   └── PdfService
    │   └── Application.java
    └── resources/
        ├── prompts/
        │   ├── meeting-notes.prompt
        │   └── rag-prompt.prompt
        └── test-data/
            └── meeting-1.txt
```

Frontend Architecture
```text
.
└── frontend/
    ├── components/
    │   ├── EmptyState.tsx
    │   ├── ExportButtons.tsx
    │   ├── Header.tsx
    │   ├── HistorySidebar.tsx
    │   ├── LoadingSpinner.tsx
    │   ├── MeetingNotesCard.tsx
    │   ├── NotificationToast.tsx
    │   ├── RagAssistantPanel.tsx
    │   └── UploadForm.tsx
    ├── models/
    │   ├── MeetingHistory.ts
    │   ├── MeetingNotes.ts
    │   ├── RagResponse.ts
    │   └── RagSource.ts
    ├── services/
    │   └── meetingApi.ts
    ├── types/
    │   └── notification.ts
    ├── utils/
    │   └── meetingFormatter.ts
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    └── index.html
```

---

## Future Improvements

- Hybrid Search (Keyword + Vector)
- pgvector
- ChromaDB
- Authentication
- Docker Compose
- Multi-user workspaces
- Cloud deployment
- Streaming
- Audio and Video upload
- Focus the RAG in one meeting/transcription only

---

## License

MIT

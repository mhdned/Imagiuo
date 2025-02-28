# Task

AI-Powered Photo Search Assistant
Create a Photo Search Assistant that processes user-uploaded images, extracts keywords using a pretrained AI model (e.g., GPT-4o), and searches Google for similar images to download and store in a PostgreSQL database. The script must asynchronously handle uploads, keyword extraction, and image downloads while storing metadata (e.g., extracted keywords, original URL, dimensions, timestamp) in a JSONB-enabled schema. Implement a lightweight UI where users can upload images, view extracted keywords, and track the download progress in real-time. Use environment variables (DB_HOST, DB_USER, etc.) for configuration and include a Docker setup for encapsulation. Provide a README.md with setup steps, .env creation, and troubleshooting

# Phases

🗂️ `DONE` Phase 1: Initial Setup
🖼️ `DONE` Phase 2: Image Upload
🤖 `DONE` Phase 3: Keyword Extraction (AI Integration)
🔍 `INPROGRESS` Phase 4: Image Search (Google Search Integration)
⚡ `INPROGRESS` Phase 5: Real-Time Progress Tracking
🛡️ `INPROGRESS` Phase 6: Optimization & Dockerization

# Project README

## Getting Started

This README will guide you through setting up and running both the frontend and backend of the project.

## Prerequisites

- Node.js and npm
- Docker (for Redis)

## Setup Instructions

### 1. Install Dependencies

First, install all dependencies for both frontend and backend:

```bash
# In the root directory
npm install
```

### 2. Set Up Redis

The backend requires Redis, which we'll run in Docker:

```bash
# Run Redis container at the default port (6379)
docker run -d -p 6379:6379 --name redis-server redis
```

### 3. Run the Frontend

Start the frontend development server:

```bash
npm run dev
```

The frontend application should now be running and accessible via your browser.

### 4. Run the Backend

First, build the backend:

```bash
npm run build
```

Then start the backend server:

```bash
npm start
```

## Development Workflow

- Frontend: Run `npm run dev` for hot-reloading development environment
- Backend: Run `npm run build` followed by `npm start` after making changes
- Redis: Ensure the Redis Docker container is running whenever working with the backend


# Project Development Guide

All implementation must follow the architecture plan:

docs/plan.md

Rules:

1. Do not implement features outside the plan
2. If architecture changes are required, update the plan first
3. Implementation must follow the module boundaries defined in the plan
4. Always update documentation after code changes

## Project Structure

This project uses **frontend-backend separation** architecture:

- `backend/` - Express + TypeScript backend with its own node_modules
- `frontend/` - React + Vite frontend with its own node_modules
- **NO workspace configuration** - frontend and backend are completely independent

### Dependency Management

- Each project (backend/frontend) has its own `node_modules/` directory
- Install dependencies separately in each directory:
  - Backend: `cd backend && npm install`
  - Frontend: `cd frontend && npm install`
- **DO NOT** create `package.json` or `node_modules` in the root directory
- **DO NOT** use npm workspaces

### Starting Services

- Backend: `cd backend && npm run dev` (runs on port 3000)
- Frontend: `cd frontend && npm run dev` (runs on port 5173)

## Ignored Files

Do not Modify or Read the following

NOTE.md
drafts/*

Rules:
1. Ignore the content, do not modify or delete these files
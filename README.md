# Chat App MERN

A full-stack chat application built with Monorepo, React + Vite on the frontend, and Express + MongoDB + Redis + Socket.IO on the backend.

## Overview

This repository is organized as a pnpm workspace with shared packages for ui, config and helpers.

### Tech Stack

- Frontend: React, Vite, TypeScript, Redux Toolkit, React Router, Socket.IO client, Tailwind CSS
- Backend: Express, TypeScript, MongoDB, Mongoose, Redis, Socket.IO, BullMQ , Cloudinary
- Workspace tooling: pnpm, Turborepo

### Main Features

- User authentication
- Conversation management
- Send and fetch chat messages
- Real-time socket connection support
- Redis-backed caching and rate limiting
- Cloudinary integration for media handling
- Graceful server shutdown and startup health checks

## Project Structure

```text
.
|-- apps
|   |-- server
|   |-- web
|-- packages
|   |-- config
|   |-- helpers
|   |-- ui
|-- package.json
|-- pnpm-workspace.yaml
|-- turbo.json
|-- README.md
```

## Prerequisites

- Node.js 18 or newer
- pnpm 9
- MongoDB
- Redis
- Cloudinary account
- SMTP credentials for email features

## Installation

```bash
pnpm install
```

## Environment Variables

Create the required `.env` files for the server and web app.

### `apps/server/.env`

```env
PORT=5000
MONGODB_URI=
EMAIL_USER=
EMAIL_PASS=
NODE_ENV=development
JWT_SECRET=
CLIENT_URL1=http://localhost:5173
CLIENT_URL2=
CLIENT_URL3=
CLIENT_URL4=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REDIS_URL=
```

### `apps/web/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Available Scripts

### Root

```bash
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm format
```

### Server

```bash
pnpm --filter server dev
pnpm --filter server build
pnpm --filter server start
```

### Web

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web preview
```

## Running the Project

1. Install dependencies with `pnpm install`.
2. Set the environment variables in `apps/server/.env` and `apps/web/.env`.
3. Start the development environment:

```bash
pnpm dev
```

## API Notes

The backend exposes routes under `/api/v1` including:

- `/api/v1/auth`
- `/api/v1/conversations`

The socket server is initialized alongside the HTTP server and the frontend connects through `VITE_SOCKET_URL`.

## Notes

- The server uses `credentials: true` CORS configuration, so the frontend URL must match one of the allowed client URLs.
- Redis must be reachable at startup because the server checks the Redis connection before accepting requests.
- The repository already includes generated `dist` output and local `node_modules` folders in the working tree, but they should stay out of version control.

## License

ISC

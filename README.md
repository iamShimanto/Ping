# ChatApp — MERN Real-Time Chat

A full-featured real-time chat application built as a **pnpm + Turborepo monorepo** with React on the frontend and Express + MongoDB + Redis + Socket.IO on the backend.

---

## Features

### Messaging
- Real-time one-to-one messaging via Socket.IO
- Emoji picker support
- Voice messages (record & send audio)
- Image & file attachments via Cloudinary
- Message search with debounce and scroll-to-highlight
- Delete messages with inline confirmation

### Calls (WebRTC)
- **Audio calls** — peer-to-peer with manual Accept/Decline
- **Video calls** — fullscreen layout with PiP local preview
- **Screen sharing** — replace camera track mid-call, auto-reverts on browser stop
- Ringing state when peer is online, Calling state when offline
- Call history with audio/video badge, direction (incoming/outgoing/missed), duration

### Real-Time
- Socket.IO-powered presence (online/offline indicators)
- Typing indicators
- Message read receipts
- Live call signaling (offer/answer/ICE via Socket.IO relay)

### Auth & Users
- Register / Login with JWT
- Password reset via SMTP
- User avatar upload (Cloudinary)
- Online status sync

### Infrastructure
- Redis-backed caching and rate limiting
- BullMQ background job queue
- Graceful server shutdown
- `GET /health` readiness probe reporting MongoDB/Redis status
- RTK Query for client-side data fetching and cache invalidation

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, TypeScript, Redux Toolkit + RTK Query, React Router, Tailwind CSS v4, Socket.IO client |
| Backend | Node.js, Express, TypeScript, MongoDB + Mongoose, Redis, Socket.IO, BullMQ, Cloudinary |
| Monorepo | pnpm workspaces, Turborepo |
| Shared packages | `@repo/ui`, `@repo/config`, `@repo/helpers` |

---

## Project Structure

```
.
├── apps/
│   ├── server/          # Express API + Socket.IO server
│   └── web/             # React + Vite frontend
├── packages/
│   ├── config/          # Shared env/config validation
│   ├── helpers/         # Shared route constants, utilities
│   └── ui/              # Shared UI components (Toast, etc.)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## Prerequisites

- Node.js >= 18
- pnpm 9
- MongoDB instance (local or Atlas)
- Redis instance (local or cloud)
- Cloudinary account
- SMTP credentials (for password-reset + welcome emails)

---

## Installation

```bash
pnpm install
```

---

## Environment Variables

### `apps/server/.env`

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=

JWT_SECRET=

EMAIL_USER=
EMAIL_PASS=

CLIENT_URL1=http://localhost:5173
CLIENT_URL2=
CLIENT_URL3=
CLIENT_URL4=

SERVER_URL=http://localhost:5000

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

REDIS_URL=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:you@example.com

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

> Full list with comments: see `apps/server/.env.example`. Only `CLIENT_URL1` is
> required — `CLIENT_URL2–4` are optional extra allowed origins.

### `apps/web/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_VAPID_PUBLIC_KEY=
VITE_WEBRTC_USERNAME=
VITE_WEBRTC_CREDENTIAL=
```

> Full list with comments: see `apps/web/.env.example`. These are build-time
> vars, baked into the bundle — set them **before** `pnpm build`.

---

## Running the Project

```bash
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev
```

To run apps individually:

```bash
pnpm --filter server dev
pnpm --filter web dev
```

To build for production:

```bash
pnpm build
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in watch mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all workspaces |
| `pnpm check-types` | TypeScript type-check all workspaces |
| `pnpm format` | Prettier format all `.ts`/`.tsx`/`.md` files |

---

## API Routes

All backend routes are prefixed with `/api/v1`:

| Route | Description |
|---|---|
| `/api/v1/auth` | Register, login, logout, reset password |
| `/api/v1/conversations` | List, create conversations; send & fetch messages |
| `/api/v1/calls` | Call history (completed, missed, rejected) |
| `/api/v1/users` | User profile, avatar upload, status |

Socket.IO events handle real-time messaging, typing indicators, presence, and WebRTC call signaling.

---

## Notes

- The CORS configuration uses `credentials: true` — the frontend URL must match one of the `CLIENT_URL1–4` env vars.
- Redis must be reachable at startup; the server performs a connection check before accepting requests.
- WebRTC signaling is relayed through the Socket.IO server. Calls also use a TURN relay hardcoded in `useWebRTC.ts` (`turn:ping-server.shimanto.dev:3478`, credentials via `VITE_WEBRTC_*`) — that host is not provisioned by this repo, so verify it is reachable (or point the ICE config at your own coturn) before relying on calls across strict NATs.

---

## License

ISC

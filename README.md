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
- Email verification
- Password reset via SMTP
- User avatar upload (Cloudinary)
- Online status sync

### Infrastructure
- Redis-backed caching and rate limiting
- BullMQ background job queue
- Graceful server shutdown with health checks
- RTK Query for client-side data fetching and cache invalidation

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, TypeScript, Redux Toolkit + RTK Query, React Router, Tailwind CSS v4, Socket.IO client |
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
- SMTP credentials (for email verification / password reset)

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
| `/api/v1/auth` | Register, login, logout, verify email, reset password |
| `/api/v1/conversations` | List, create conversations; send & fetch messages |
| `/api/v1/calls` | Call history (completed, missed, rejected) |
| `/api/v1/users` | User profile, avatar upload, status |

Socket.IO events handle real-time messaging, typing indicators, presence, and WebRTC call signaling.

---

## Notes

- The CORS configuration uses `credentials: true` — the frontend URL must match one of the `CLIENT_URL1–4` env vars.
- Redis must be reachable at startup; the server performs a connection check before accepting requests.
- WebRTC signaling is relayed through the Socket.IO server — no TURN server is configured by default. For production use across strict NATs, add a TURN server to the ICE config in `useWebRTC.ts`.

---

## License

ISC

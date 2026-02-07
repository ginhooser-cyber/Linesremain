# 🎮 Lineremain

**A multiplayer survival game built for the browser.**

Gather resources, craft tools, build bases, and survive against the elements and other players — all rendered in a stylized 2.5D voxel world powered by HTML5 Canvas.

---

## ✨ Features

- **Multiplayer** — Real-time PvP and co-op via WebSocket
- **Procedural World** — Infinite terrain with biomes, monuments, and resources
- **Building System** — Place walls, floors, doors, and tool cupboards with decay & authorization
- **Crafting & Inventory** — 20+ craftable items with drag-and-drop inventory
- **Combat** — Melee and ranged weapons, projectiles, hit detection, loot drops
- **Survival Mechanics** — Hunger, thirst, temperature, health, and status effects
- **Day/Night Cycle** — Dynamic lighting with time-of-day progression
- **Weather System** — Rain, clouds, and environmental fog
- **AI Enemies** — Hostile NPCs with pathfinding and aggression
- **Teams & Clans** — Form groups, share bases, chat with teammates
- **Persistent World** — Auto-saving chunks, player states, and buildings to PostgreSQL
- **Procedural Audio** — Web Audio API generated sound effects (no asset files needed)

---

## 📸 Screenshots

> *Screenshots coming soon — run the game locally to see it in action!*

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Client** | TypeScript, React 18, Zustand, HTML5 Canvas, Web Audio API |
| **Server** | TypeScript, Node.js, Express, Socket.IO, Pino |
| **Database** | PostgreSQL 16, Drizzle ORM |
| **Cache** | Redis 7 |
| **Build** | Vite, npm workspaces |
| **Deploy** | Docker, Docker Compose, nginx |
| **Shared** | Monorepo with `shared/` package for types, constants, and utilities |

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js 20+** and **npm 10+**
- **PostgreSQL 16** and **Redis 7** (or use Docker)
- **Git**

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/lineremain.git
cd lineremain
```

### 2. Start databases with Docker

```bash
docker compose up postgres redis -d
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings (defaults work for local dev)
```

### 5. Build shared library

```bash
npm run build -w shared
```

### 6. Run database migrations

```bash
npm run db:migrate -w server
```

### 7. Start development servers

```bash
# Terminal 1: Start the game server
npm run dev -w server

# Terminal 2: Start the client dev server
npm run dev -w client
```

### 8. Open in browser

Navigate to `http://localhost:5173`

---

## 🐳 Production Deployment

For production deployment using Docker Compose on Google Cloud:

```bash
docker compose up --build -d
```

📖 **Full deployment guide:** [deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md)

---

## 🎮 How to Play

### Controls

| Key | Action |
|-----|--------|
| `W` `A` `S` `D` | Move |
| `Mouse` | Look around |
| `Left Click` | Attack / Use tool |
| `Right Click` | Place building piece |
| `1` - `6` | Select hotbar slot |
| `Tab` | Open inventory |
| `C` | Open crafting menu |
| `B` | Open building menu |
| `M` | Open map |
| `T` | Open team panel |
| `Enter` | Open chat |
| `Escape` | Close current panel |

### Survival Tips

1. **Gather wood and stone** first — you'll need them for tools and shelter
2. **Craft a hatchet** to gather resources faster
3. **Build a base** before nightfall — temperatures drop and enemies get aggressive
4. **Place a tool cupboard** inside your base to prevent decay and block enemy building
5. **Stay fed and hydrated** — hunger and thirst drain health over time
6. **Team up** with other players for safety in numbers

---

## 🏗 Architecture

```
lineremain/
├── shared/          # Shared types, constants, utilities (npm workspace)
│   └── src/
│       ├── types/       # TypeScript interfaces (items, blocks, entities, etc.)
│       ├── constants/   # Game balance values (combat, survival, recipes)
│       └── utils/       # Chunk math, inventory helpers
├── server/          # Game server (npm workspace)
│   └── src/
│       ├── api/         # REST API (Express routes, auth, validation)
│       ├── auth/        # JWT authentication, password hashing
│       ├── database/    # Drizzle ORM schema, migrations, repositories
│       ├── game/        # ECS game loop, systems (combat, physics, AI, etc.)
│       ├── network/     # Socket.IO server, protocol, rate limiting
│       ├── world/       # Terrain generation, biomes, chunk storage, world saving
│       └── utils/       # Logger (pino), math, noise, graceful shutdown
├── client/          # Game client (npm workspace)
│   └── src/
│       ├── engine/      # Camera, input, particles, audio, asset loading
│       ├── entities/    # Player, NPC, building, item renderers
│       ├── network/     # Socket.IO client, message handling, input sending
│       ├── stores/      # Zustand state (game, player, UI, settings, chat)
│       ├── systems/     # Client prediction, interpolation, animation, combat FX
│       ├── ui/          # React components (HUD, panels, screens, common)
│       ├── world/       # Chunk meshing, lighting, sky, water, weather
│       └── utils/       # Item icons, helpers
├── deploy/          # Deployment scripts and documentation
├── Dockerfile.server
├── Dockerfile.client
└── docker-compose.yml
```

### Key Design Decisions

- **ECS Architecture** — Server game logic uses an Entity Component System for clean separation of concerns
- **Client Prediction** — Player movement is predicted client-side and reconciled with server state
- **Entity Interpolation** — Remote entities are smoothly interpolated between server snapshots
- **Chunk-based World** — Terrain is divided into chunks for efficient streaming and persistence
- **Binary Protocol** — Socket.IO messages use structured data for minimal bandwidth
- **Auto-Save** — World state is periodically saved to PostgreSQL with dirty-chunk tracking

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** for your feature: `git checkout -b feature/my-feature`
3. **Make your changes** and ensure the code builds: `npm run build`
4. **Test locally** — run the server and client, verify your changes in-game
5. **Commit** with a descriptive message: `git commit -m "Add my feature"`
6. **Push** and open a **Pull Request**

### Code Style

- TypeScript strict mode enabled
- Prettier for formatting (run `npx prettier --write .`)
- ESLint for linting
- Pino for server-side logging (no `console.log` in server code)
- Organize imports: external → internal → relative

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

- **Game Design & Development** — Lineremain Team
- **Procedural Generation** — Simplex noise via custom implementation
- **Networking** — [Socket.IO](https://socket.io/) for real-time WebSocket communication
- **Database** — [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL
- **UI Framework** — [React](https://react.dev/) with [Zustand](https://zustand-demo.pmnd.rs/) state management
- **Build Tool** — [Vite](https://vitejs.dev/) for lightning-fast client builds
- **Audio** — Procedurally generated via the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
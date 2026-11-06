import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/multiplayer" });
const players = new Map();

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true, game: "Masr Racer" }));

wss.on("connection", (socket) => {
  const id = Math.random().toString(36).slice(2, 9);
  players.set(id, { id, x: 0, z: 0, heading: 0, color: "#e53935" });
  socket.send(JSON.stringify({ type: "welcome", id, players: [...players.values()] }));

  socket.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "state") {
        const old = players.get(id);
        if (!old) return;
        // Keep network state small and reject non-finite coordinates.
        const n = (v, fallback) => Number.isFinite(v) ? Math.max(-100000, Math.min(100000, v)) : fallback;
        players.set(id, {
          ...old,
          x: n(msg.x, old.x),
          z: n(msg.z, old.z),
          heading: n(msg.heading, old.heading)
        });
        const packet = JSON.stringify({ type: "players", players: [...players.values()] });
        for (const client of wss.clients) if (client.readyState === 1) client.send(packet);
      }
    } catch { /* Ignore malformed packets. */ }
  });

  socket.on("close", () => {
    players.delete(id);
    const packet = JSON.stringify({ type: "players", players: [...players.values()] });
    for (const client of wss.clients) if (client.readyState === 1) client.send(packet);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Masr Racer running at http://localhost:${port}`));

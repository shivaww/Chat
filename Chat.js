# Chat
// Simple WebRTC signaling server
// Run locally: node server.js
// Deploy: upload to Render / Railway

const WebSocket = require("ws");
const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });
const rooms = {};

wss.on("connection", ws => {
  ws.on("message", msg => {
    try {
      const data = JSON.parse(msg);
      const { type, room, payload } = data;

      if (!room) return;

      if (type === "join") {
        ws.room = room;
        rooms[room] = rooms[room] || [];
        rooms[room].push(ws);

        rooms[room].forEach(peer => {
          if (peer !== ws && peer.readyState === WebSocket.OPEN) {
            peer.send(JSON.stringify({ type: "peer-joined" }));
          }
        });
        return;
      }

      if (["offer", "answer", "candidate"].includes(type)) {
        (rooms[room] || []).forEach(peer => {
          if (peer !== ws && peer.readyState === WebSocket.OPEN) {
            peer.send(JSON.stringify({ type, payload }));
          }
        });
      }
    } catch (e) {
      console.error("Invalid message:", e);
    }
  });

  ws.on("close", () => {
    const room = ws.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter(p => p !== ws);
    }
  });
});

console.log(`Signaling server running on port ${PORT}`);

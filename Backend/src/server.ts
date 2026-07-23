// server.ts
import app, { setupSocket, getSocketInstance } from './app';
import { createServer } from 'http';
import { config } from './config';

const server = createServer(app);
const io = setupSocket(server); 
app.set('io', io);

console.log('[server.ts] Socket.IO instance initialized:', !!getSocketInstance());

server.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
});

export { io };
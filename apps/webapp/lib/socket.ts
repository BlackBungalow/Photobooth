import type { Server } from 'socket.io';

declare global {
  // eslint-disable-next-line no-var
  var socketIo: Server | undefined;
}

export function emitPhoto(projectSlug: string, payload: unknown) {
  if (globalThis.socketIo) {
    globalThis.socketIo.to(projectSlug).emit('photo:new', payload);
    globalThis.socketIo.emit('photo:new', payload);
  }
}

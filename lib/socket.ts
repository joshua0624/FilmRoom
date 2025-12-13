import { Server as SocketIOServer } from 'socket.io';

declare global {
  var io: SocketIOServer | undefined;
}

export const getSocketInstance = (): SocketIOServer | null => {
  if (typeof global.io !== 'undefined') {
    return global.io;
  }
  return null;
};

export const emitToSession = (
  sessionId: string,
  event: string,
  data: any
) => {
  const io = getSocketInstance();
  if (io) {
    io.to(`session-${sessionId}`).emit(event, data);
  }
};


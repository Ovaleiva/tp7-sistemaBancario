export class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(userId) {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';
    this.socket = new WebSocket(WS_URL);
    
    this.socket.onopen = () => {
      console.log('✅ WebSocket connected');
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        userId: userId
      }));
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyListeners(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };
  }

  onEvent(callback) {
    const id = Math.random().toString(36);
    this.listeners.set(id, callback);
    
    return () => {
      this.listeners.delete(id);
    };
  }

  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in WebSocket listener:', error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const webSocketService = new WebSocketService();
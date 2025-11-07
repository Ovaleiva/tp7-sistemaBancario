// services/websocket.js
class WebSocketService {
  constructor() {
    this.ws = null;
    this.eventCallbacks = [];
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket ya está conectado');
      return;
    }

    this.userId = userId;
    this.ws = new WebSocket('ws://localhost:3002');

    this.ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      this.reconnectAttempts = 0;
      
      // Suscribirse a eventos
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        userId: this.userId
      }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 Evento recibido via WebSocket:', data.type);
        this.eventCallbacks.forEach(callback => callback(data));
      } catch (error) {
        console.error('❌ Error parseando mensaje WebSocket:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('❌ WebSocket desconectado');
      
      // Reconexión automática
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.connect(this.userId), 2000);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  onEvent(callback) {
    this.eventCallbacks.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const webSocketService = new WebSocketService();
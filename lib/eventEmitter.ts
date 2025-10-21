// Simple event emitter for React Native compatibility
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  // Subscribe to an event
  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  // Emit an event
  emit(event: string, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event: string) {
    this.events[event] = [];
  }
}

// Create a global instance
const eventEmitter = new EventEmitter();

export default eventEmitter;
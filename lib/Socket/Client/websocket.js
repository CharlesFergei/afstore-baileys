//=======================================================//
import { DEFAULT_ORIGIN } from "../../Defaults/index.js";
import { AbstractSocketClient } from "./types.js";
import WebSocket from "ws";
//=======================================================//
export class WebSocketClient extends AbstractSocketClient {
  constructor() {
    super(...arguments);
    this.socket = null;
    this.isAlive = false;
    this.heartbeatTimer = null;
    // Prevent unhandled error event from crashing process
    this.on("error", () => {});
  }
  get isOpen() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
  get isClosed() {
    return this.socket === null || this.socket?.readyState === WebSocket.CLOSED;
  }
  get isClosing() {
    return this.socket === null || this.socket?.readyState === WebSocket.CLOSING;
  }
  get isConnecting() {
    return this.socket?.readyState === WebSocket.CONNECTING;
  }
  async connect() {
    if (this.socket) {
      return;
    }
    this.socket = new WebSocket(this.url, {
      origin: DEFAULT_ORIGIN,
      headers: this.config.options?.headers,
      handshakeTimeout: this.config.connectTimeoutMs,
      timeout: this.config.connectTimeoutMs,
      agent: this.config.agent
    });
    this.socket.setMaxListeners(0);
    this.isAlive = true;

    // Active Heartbeat to detect silent socket drops on VPS / Pterodactyl panels
    const setupHeartbeat = () => {
      this.clearHeartbeat();
      const intervalMs = Math.max(10000, Number(this.config.keepAliveIntervalMs) || 15000);
      this.heartbeatTimer = setInterval(() => {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
          return;
        }
        if (!this.isAlive) {
          // Socket is frozen / silent drop detected: force terminate to trigger clean reconnect
          try {
            this.socket.terminate();
          } catch (_) {}
          return;
        }
        this.isAlive = false;
        try {
          this.socket.ping();
        } catch (_) {}
      }, intervalMs);
      if (typeof this.heartbeatTimer.unref === "function") {
        this.heartbeatTimer.unref();
      }
    };

    const events = ["close", "error", "upgrade", "message", "open", "ping", "pong", "unexpected-response"];
    for (const event of events) {
      this.socket?.on(event, (...args) => {
        if (event === "open") {
          this.isAlive = true;
          setupHeartbeat();
        } else if (event === "pong" || event === "ping" || event === "message") {
          this.isAlive = true;
        } else if (event === "close" || event === "error") {
          this.clearHeartbeat();
        }
        this.emit(event, ...args);
      });
    }
  }
  clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  async close() {
    this.clearHeartbeat();
    if (!this.socket) {
      return;
    }
    const s = this.socket;
    this.socket = null;
    try {
      s.close();
      // Ensure dead socket does not hang the process if close frame gets no response
      setTimeout(() => {
        try {
          if (s && s.readyState !== WebSocket.CLOSED) {
            s.terminate();
          }
        } catch (_) {}
      }, 3000).unref();
    } catch (_) {
      try {
        s.terminate();
      } catch (_) {}
    }
  }
  send(str, cb) {
    this.socket?.send(str, cb);
    return Boolean(this.socket);
  }
}
//=======================================================//
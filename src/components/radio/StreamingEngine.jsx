import { toast } from "sonner";

export class StreamingEngine {
  constructor(azuracastSettings, debugLogger) {
    this.settings = azuracastSettings;
    this.log = debugLogger || console.log;
    this.mediaStream = null;
    this.audioContext = null;
    this.mediaStreamSource = null;
    this.processor = null;
    this.websocket = null;
    this.isStreaming = false;
    this.audioLevel = 0;
    this.connectionQuality = 'excellent';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.sampleRate = 44100;
  }

  async initialize(stream) {
    try {
      this.log("🎵 Initializing audio engine...", "info");
      this.mediaStream = stream;
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate,
        latencyHint: 'interactive'
      });
      
      this.log(`✅ AudioContext created, sample rate: ${this.audioContext.sampleRate}`, "success");
      
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      
      this.mediaStreamSource.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      await this.createAudioProcessor();
      
      this.log("✅ Audio engine initialized", "success");
      return true;
    } catch (error) {
      this.log(`❌ Failed to initialize: ${error.message}`, "error");
      toast.error("Failed to initialize audio engine: " + error.message);
      return false;
    }
  }

  async createAudioProcessor() {
    try {
      const bufferSize = 4096;
      this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      this.processor.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isStreaming) return;
        
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        this.sendAudioData(inputData);
      };
      
      this.gainNode.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.log("✅ Audio processor ready", "success");
    } catch (error) {
      this.log(`❌ Processor failed: ${error.message}`, "error");
    }
  }

  async startStreaming(showId) {
    try {
      this.log("📡 Connecting to AzuraCast...", "info");
      
      const wsProtocol = this.settings.azuracast_url.startsWith('https') ? 'wss' : 'ws';
      const baseUrl = this.settings.azuracast_url.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}://${baseUrl}/api/station/${this.settings.station_id}/backend/dj`;
      
      this.log(`🔗 WebSocket URL: ${wsUrl}`, "info");
      
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        this.log("✅ WebSocket CONNECTED!", "success");
        
        const authMessage = {
          type: 'auth',
          username: this.settings.dj_username,
          password: this.settings.dj_password,
          mount_point: this.settings.mount_point,
          show_id: showId
        };
        
        this.log(`🔐 Sending auth for user: ${this.settings.dj_username}`, "info");
        this.websocket.send(JSON.stringify(authMessage));
        
        this.isStreaming = true;
        this.connectionQuality = 'excellent';
        this.reconnectAttempts = 0;
        toast.success("Connected to streaming server!");
      };
      
      this.websocket.onclose = (event) => {
        this.log(`⚠️ WebSocket closed - Code: ${event.code}, Reason: ${event.reason || 'None'}`, "warning");
        this.handleDisconnection();
      };
      
      this.websocket.onerror = (error) => {
        this.log(`❌ WebSocket ERROR: ${error.type}`, "error");
        toast.error("Streaming connection error");
        this.connectionQuality = 'poor';
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.log(`📨 Server: ${JSON.stringify(message)}`, "info");
          this.handleServerMessage(message);
        } catch (e) {
          this.log(`📨 Server: ${event.data}`, "info");
        }
      };
      
      this.startAudioLevelMonitoring();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (this.websocket.readyState === WebSocket.OPEN) {
        this.log("✅ Streaming active", "success");
        return true;
      } else {
        this.log(`⚠️ WebSocket state: ${this.websocket.readyState} (0=connecting, 1=open, 2=closing, 3=closed)`, "warning");
        return false;
      }
    } catch (error) {
      this.log(`❌ Connection failed: ${error.message}`, "error");
      toast.error("Failed to connect: " + error.message);
      return false;
    }
  }

  sendAudioData(audioData) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    try {
      const int16Data = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        const sample = Math.max(-1, Math.min(1, audioData[i]));
        int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }
      
      this.websocket.send(int16Data.buffer);
    } catch (error) {
      this.log(`❌ Send failed: ${error.message}`, "error");
      this.connectionQuality = 'poor';
    }
  }

  handleServerMessage(message) {
    switch (message.type) {
      case 'auth_success':
        this.log("✅ Authentication SUCCESS", "success");
        toast.success("Authenticated!");
        break;
      case 'auth_failed':
        this.log(`❌ Authentication FAILED: ${message.reason || 'Unknown'}`, "error");
        toast.error("Auth failed: " + (message.reason || "Check credentials"));
        this.stopStreaming();
        break;
      case 'ping':
        this.websocket.send(JSON.stringify({ type: 'pong' }));
        break;
      case 'listener_count':
        this.log(`👥 Listeners: ${message.count}`, "info");
        break;
      case 'error':
        this.log(`❌ Server error: ${message.message}`, "error");
        toast.error("Server: " + message.message);
        break;
    }
  }

  startAudioLevelMonitoring() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    let frameCount = 0;
    
    const monitor = () => {
      if (!this.isStreaming) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      this.audioLevel = sum / dataArray.length / 255;
      
      frameCount++;
      if (frameCount >= 120) {
        this.log(`🎚️ Audio: ${Math.round(this.audioLevel * 100)}%`, "info");
        frameCount = 0;
      }
      
      requestAnimationFrame(monitor);
    };
    
    monitor();
  }

  handleDisconnection() {
    if (this.isStreaming && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.connectionQuality = 'reconnecting';
      this.log(`🔄 Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, "warning");
      toast.info(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.startStreaming();
      }, 2000 * this.reconnectAttempts);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log("❌ Max reconnection attempts reached", "error");
      toast.error("Connection lost");
      this.stopStreaming();
    }
  }

  getAudioLevel() {
    return this.audioLevel;
  }

  getConnectionQuality() {
    return this.connectionQuality;
  }

  async stopStreaming() {
    this.log("⏹️ Stopping stream...", "info");
    
    this.isStreaming = false;
    
    if (this.websocket) {
      try {
        this.websocket.send(JSON.stringify({ type: 'disconnect' }));
        this.websocket.close();
        this.log("✅ WebSocket closed", "success");
      } catch (e) {
        this.log(`❌ Close error: ${e.message}`, "error");
      }
      this.websocket = null;
    }
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
    }
    
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.log("✅ Stream stopped", "success");
  }

  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }
}
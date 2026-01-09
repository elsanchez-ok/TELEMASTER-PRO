/**
 * TeleMaster Pro - Servidor Backend
 * Servidor principal para procesamiento y streaming
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

class TeleMasterServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.port = process.env.PORT || 8080;
        this.clients = new Set();
        this.streams = new Map();
        this.recordings = new Map();
        this.hardware = new Map();
        
        this.init();
    }
    
    init() {
        // Middleware
        this.setupMiddleware();
        
        // Rutas
        this.setupRoutes();
        
        // WebSocket
        this.setupWebSocket();
        
        // Inicialización
        this.setupHardware();
        
        // Iniciar servidor
        this.start();
    }
    
    setupMiddleware() {
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        
        // JSON parsing
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Archivos estáticos
        this.app.use(express.static(path.join(__dirname, '../')));
    }
    
    setupRoutes() {
        // Ruta principal
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../index.html'));
        });
        
        // API REST
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'ok',
                version: '1.0.0',
                uptime: process.uptime(),
                streams: this.streams.size,
                recordings: this.recordings.size,
                clients: this.clients.size
            });
        });
        
        this.app.get('/api/hardware', (req, res) => {
            res.json({
                devices: Array.from(this.hardware.values())
            });
        });
        
        this.app.post('/api/stream/start', (req, res) => {
            try {
                const streamId = this.startStream(req.body);
                res.json({ success: true, streamId });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/stream/stop', (req, res) => {
            try {
                this.stopStream(req.body.streamId);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/record/start', (req, res) => {
            try {
                const recordId = this.startRecording(req.body);
                res.json({ success: true, recordId });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/record/stop', (req, res) => {
            try {
                this.stopRecording(req.body.recordId);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/transition', (req, res) => {
            try {
                this.performTransition(req.body);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Configuración
        this.app.get('/api/config', (req, res) => {
            res.json(this.loadConfig());
        });
        
        this.app.post('/api/config', (req, res) => {
            try {
                this.saveConfig(req.body);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('🔗 Nuevo cliente WebSocket conectado');
            this.clients.add(ws);
            
            // Enviar estado inicial
            this.sendToClient(ws, {
                type: 'system_status',
                data: {
                    streams: this.streams.size,
                    recordings: this.recordings.size,
                    hardware: Array.from(this.hardware.values())
                }
            });
            
            // Manejar mensajes
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, message);
            });
            
            // Manejar desconexión
            ws.on('close', () => {
                console.log('🔌 Cliente WebSocket desconectado');
                this.clients.delete(ws);
            });
            
            // Manejar errores
            ws.on('error', (error) => {
                console.error('❌ Error WebSocket:', error);
            });
        });
        
        // Heartbeat
        setInterval(() => {
            this.broadcast({
                type: 'heartbeat',
                timestamp: Date.now()
            });
        }, 30000);
    }
    
    setupHardware() {
        // Simulación de detección de hardware
        this.hardware.set('decklink-0', {
            id: 'decklink-0',
            type: 'blackmagic',
            name: 'DeckLink SDI 1',
            model: 'DeckLink SDI 4K',
            ports: ['SDI In 1', 'SDI In 2', 'SDI Out 1', 'SDI Out 2'],
            formats: ['1080p50', '1080p60', '4Kp30'],
            status: 'connected'
        });
        
        this.hardware.set('ndi-1', {
            id: 'ndi-1',
            type: 'ndi',
            name: 'NDI Source 1',
            address: '192.168.1.100',
            resolution: '1920x1080',
            fps: 30,
            status: 'connected'
        });
        
        console.log('🔧 Hardware inicializado:', this.hardware.size, 'dispositivos');
    }
    
    handleWebSocketMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'command':
                    this.handleCommand(ws, data);
                    break;
                    
                case 'get_status':
                    this.sendStatus(ws);
                    break;
                    
                case 'ping':
                    this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
                    break;
                    
                default:
                    console.log('📨 Mensaje WebSocket:', data.type);
            }
        } catch (error) {
            console.error('❌ Error procesando mensaje WebSocket:', error);
        }
    }
    
    handleCommand(ws, data) {
        const { command, params } = data;
        
        console.log(`⚡ Comando recibido: ${command}`, params);
        
        switch (command) {
            case 'start_stream':
                this.startStream(params);
                break;
                
            case 'stop_stream':
                this.stopStream(params.streamId);
                break;
                
            case 'start_recording':
                this.startRecording(params);
                break;
                
            case 'stop_recording':
                this.stopRecording(params.recordId);
                break;
                
            case 'transition':
                this.performTransition(params);
                break;
                
            case 'set_scene':
                this.setScene(params);
                break;
                
            default:
                console.warn(`⚠️ Comando desconocido: ${command}`);
        }
    }
    
    startStream(config) {
        const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🚀 Iniciando stream: ${streamId}`);
        
        // Simulación de stream
        const stream = {
            id: streamId,
            config: config,
            status: 'running',
            startTime: Date.now(),
            stats: {
                bitrate: 0,
                viewers: 0,
                droppedFrames: 0
            }
        };
        
        this.streams.set(streamId, stream);
        
        // Broadcast a clientes
        this.broadcast({
            type: 'stream_started',
            data: { streamId, config }
        });
        
        // Simular actualizaciones de estadísticas
        const statsInterval = setInterval(() => {
            if (this.streams.has(streamId)) {
                stream.stats.bitrate = 5000000 + Math.random() * 3000000;
                stream.stats.viewers += Math.floor(Math.random() * 10);
                stream.stats.droppedFrames += Math.floor(Math.random() * 3);
                
                this.broadcast({
                    type: 'stream_stats',
                    data: { streamId, stats: stream.stats }
                });
            } else {
                clearInterval(statsInterval);
            }
        }, 5000);
        
        return streamId;
    }
    
    stopStream(streamId) {
        if (this.streams.has(streamId)) {
            console.log(`🛑 Deteniendo stream: ${streamId}`);
            
            const stream = this.streams.get(streamId);
            stream.status = 'stopped';
            stream.endTime = Date.now();
            
            this.broadcast({
                type: 'stream_stopped',
                data: { streamId }
            });
            
            this.streams.delete(streamId);
        }
    }
    
    startRecording(config) {
        const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🔴 Iniciando grabación: ${recordId}`);
        
        // Simulación de grabación
        const recording = {
            id: recordId,
            config: config,
            status: 'recording',
            startTime: Date.now(),
            fileSize: 0,
            duration: 0
        };
        
        this.recordings.set(recordId, recording);
        
        // Broadcast a clientes
        this.broadcast({
            type: 'recording_started',
            data: { recordId, config }
        });
        
        // Simular crecimiento de archivo
        const updateInterval = setInterval(() => {
            if (this.recordings.has(recordId)) {
                recording.fileSize += 10000000; // 10MB por segundo
                recording.duration = (Date.now() - recording.startTime) / 1000;
                
                this.broadcast({
                    type: 'recording_update',
                    data: { recordId, ...recording }
                });
            } else {
                clearInterval(updateInterval);
            }
        }, 1000);
        
        return recordId;
    }
    
    stopRecording(recordId) {
        if (this.recordings.has(recordId)) {
            console.log(`⏹️ Deteniendo grabación: ${recordId}`);
            
            const recording = this.recordings.get(recordId);
            recording.status = 'stopped';
            recording.endTime = Date.now();
            
            this.broadcast({
                type: 'recording_stopped',
                data: { recordId, fileSize: recording.fileSize, duration: recording.duration }
            });
            
            this.recordings.delete(recordId);
        }
    }
    
    performTransition(params) {
        console.log(`🔄 Transición: ${params.type} de ${params.from} a ${params.to}`);
        
        // Broadcast a clientes
        this.broadcast({
            type: 'transition',
            data: params
        });
    }
    
    setScene(params) {
        console.log(`📺 Cambiando escena: ${params.sceneId}`);
        
        this.broadcast({
            type: 'scene_changed',
            data: params
        });
    }
    
    sendStatus(ws) {
        this.sendToClient(ws, {
            type: 'system_status',
            data: {
                streams: this.streams.size,
                recordings: this.recordings.size,
                hardware: Array.from(this.hardware.values()),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }
        });
    }
    
    broadcast(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }
    
    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    
    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config', 'defaults.json');
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
        }
        
        // Configuración por defecto
        return {
            video: {
                resolution: '1920x1080',
                fps: 50,
                bitrate: '8000000',
                codec: 'h264'
            },
            audio: {
                channels: 2,
                sampleRate: 48000,
                bitrate: '192000',
                codec: 'aac'
            },
            streaming: {
                destinations: [],
                adaptiveBitrate: true
            }
        };
    }
    
    saveConfig(config) {
        try {
            const configDir = path.join(__dirname, 'config');
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            const configPath = path.join(configDir, 'defaults.json');
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            
            console.log('💾 Configuración guardada');
        } catch (error) {
            console.error('❌ Error guardando configuración:', error);
            throw error;
        }
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 Servidor TeleMaster Pro iniciado`);
            console.log(`📡 HTTP: http://localhost:${this.port}`);
            console.log(`🔗 WebSocket: ws://localhost:${this.port}`);
            console.log(`📁 Directorio: ${__dirname}`);
        });
        
        // Manejar cierre elegante
        process.on('SIGINT', () => {
            console.log('\n🛑 Deteniendo servidor...');
            this.stopAllStreams();
            this.stopAllRecordings();
            process.exit(0);
        });
    }
    
    stopAllStreams() {
        this.streams.forEach((stream, streamId) => {
            this.stopStream(streamId);
        });
    }
    
    stopAllRecordings() {
        this.recordings.forEach((recording, recordId) => {
            this.stopRecording(recordId);
        });
    }
}

// Iniciar servidor si se ejecuta directamente
if (require.main === module) {
    const server = new TeleMasterServer();
}

module.exports = TeleMasterServer;

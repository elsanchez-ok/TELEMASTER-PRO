/**
 * TeleMaster Pro - Servidor Principal
 * Archivo único de servidor con toda la lógica
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

class TeleMasterServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.port = process.env.PORT || 3000;
        this.clients = new Set();
        this.streams = new Map();
        this.recordings = new Map();
        this.hardware = new Map();
        this.scenes = new Map();
        this.sources = new Map();
        
        this.init();
    }
    
    init() {
        // Middleware
        this.setupMiddleware();
        
        // Rutas estáticas (frontend)
        this.setupStaticFiles();
        
        // API Routes
        this.setupRoutes();
        
        // WebSocket
        this.setupWebSocket();
        
        // Inicializar sistema
        this.initializeSystem();
        
        // Iniciar servidor
        this.start();
    }
    
    setupMiddleware() {
        // CORS
        this.app.use(cors());
        
        // JSON parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
            next();
        });
    }
    
    setupStaticFiles() {
        // Servir archivos estáticos del frontend
        this.app.use(express.static(path.join(__dirname, '..')));
        this.app.use('/src', express.static(path.join(__dirname, '../src')));
        
        // Ruta para index.html
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../index.html'));
        });
    }
    
    setupRoutes() {
        // API Health Check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                version: '1.0.0',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                resources: {
                    streams: this.streams.size,
                    recordings: this.recordings.size,
                    scenes: this.scenes.size,
                    sources: this.sources.size,
                    clients: this.clients.size
                }
            });
        });
        
        // Hardware API
        this.app.get('/api/hardware', (req, res) => {
            res.json({
                success: true,
                devices: Array.from(this.hardware.values()),
                count: this.hardware.size
            });
        });
        
        this.app.post('/api/hardware/scan', async (req, res) => {
            try {
                const devices = await this.scanHardware();
                res.json({ success: true, devices });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Stream API
        this.app.get('/api/streams', (req, res) => {
            res.json({
                success: true,
                streams: Array.from(this.streams.values())
            });
        });
        
        this.app.post('/api/stream/start', async (req, res) => {
            try {
                const { config } = req.body;
                const streamId = await this.startStream(config);
                res.json({ success: true, streamId });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.post('/api/stream/stop/:id', async (req, res) => {
            try {
                const { id } = req.params;
                await this.stopStream(id);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Recording API
        this.app.get('/api/recordings', (req, res) => {
            res.json({
                success: true,
                recordings: Array.from(this.recordings.values())
            });
        });
        
        this.app.post('/api/record/start', async (req, res) => {
            try {
                const { config } = req.body;
                const recordId = await this.startRecording(config);
                res.json({ success: true, recordId });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.post('/api/record/stop/:id', async (req, res) => {
            try {
                const { id } = req.params;
                await this.stopRecording(id);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Scenes API
        this.app.get('/api/scenes', (req, res) => {
            res.json({
                success: true,
                scenes: Array.from(this.scenes.values())
            });
        });
        
        this.app.get('/api/scenes/:id', (req, res) => {
            const { id } = req.params;
            const scene = this.scenes.get(id);
            
            if (scene) {
                res.json({ success: true, scene });
            } else {
                res.status(404).json({ success: false, error: 'Scene not found' });
            }
        });
        
        this.app.post('/api/scenes', async (req, res) => {
            try {
                const scene = req.body;
                await this.saveScene(scene);
                res.json({ success: true, scene });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.put('/api/scenes/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const updates = req.body;
                await this.updateScene(id, updates);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.delete('/api/scenes/:id', async (req, res) => {
            try {
                const { id } = req.params;
                await this.deleteScene(id);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Sources API
        this.app.get('/api/sources', (req, res) => {
            res.json({
                success: true,
                sources: Array.from(this.sources.values())
            });
        });
        
        this.app.post('/api/sources', async (req, res) => {
            try {
                const source = req.body;
                await this.addSource(source);
                res.json({ success: true, source });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Config API
        this.app.get('/api/config', (req, res) => {
            try {
                const config = this.loadConfig();
                res.json({ success: true, config });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.post('/api/config', async (req, res) => {
            try {
                const config = req.body;
                await this.saveConfig(config);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Transition API
        this.app.post('/api/transition', async (req, res) => {
            try {
                const { type, fromScene, toScene, duration } = req.body;
                await this.performTransition(type, fromScene, toScene, duration);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // System API
        this.app.get('/api/system/stats', (req, res) => {
            try {
                const stats = this.getSystemStats();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.post('/api/system/restart', async (req, res) => {
            try {
                await this.restartSystem();
                res.json({ success: true, message: 'System restart initiated' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // 404 Handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ success: false, error: 'Endpoint not found' });
        });
        
        // Error Handler
        this.app.use((err, req, res, next) => {
            console.error('Server error:', err);
            res.status(500).json({ 
                success: false, 
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`🔗 WebSocket connected: ${clientId}`);
            
            // Agregar cliente
            this.clients.add(ws);
            
            // Configurar cliente
            ws.clientId = clientId;
            ws.isAlive = true;
            
            // Enviar bienvenida
            this.sendToClient(ws, {
                type: 'welcome',
                clientId,
                timestamp: new Date().toISOString(),
                system: {
                    version: '1.0.0',
                    streams: this.streams.size,
                    scenes: this.scenes.size
                }
            });
            
            // Heartbeat
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            
            // Manejar mensajes
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, message);
            });
            
            // Manejar desconexión
            ws.on('close', () => {
                console.log(`🔌 WebSocket disconnected: ${clientId}`);
                this.clients.delete(ws);
                this.broadcast({
                    type: 'client_disconnected',
                    clientId,
                    timestamp: new Date().toISOString()
                });
            });
            
            // Manejar errores
            ws.on('error', (error) => {
                console.error(`❌ WebSocket error (${clientId}):`, error);
            });
            
            // Notificar a otros clientes
            this.broadcast({
                type: 'client_connected',
                clientId,
                timestamp: new Date().toISOString()
            });
        });
        
        // Heartbeat interval
        const heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    console.log(`💀 Terminating dead connection: ${ws.clientId}`);
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
        
        // Limpiar intervalo al cerrar
        this.wss.on('close', () => {
            clearInterval(heartbeatInterval);
        });
    }
    
    async initializeSystem() {
        console.log('🚀 Initializing TeleMaster Pro System...');
        
        // Cargar configuración
        await this.loadSystemConfig();
        
        // Detectar hardware
        await this.detectHardware();
        
        // Cargar datos iniciales
        await this.loadInitialData();
        
        console.log('✅ System initialization complete');
    }
    
    async loadSystemConfig() {
        try {
            const configPath = path.join(__dirname, 'config', 'defaults.json');
            
            if (fs.existsSync(configPath)) {
                const configData = fs.readFileSync(configPath, 'utf8');
                this.config = JSON.parse(configData);
                console.log('📁 Config loaded from file');
            } else {
                // Configuración por defecto
                this.config = {
                    system: {
                        name: 'TeleMaster Pro',
                        version: '1.0.0',
                        autoStart: false,
                        logLevel: 'info'
                    },
                    video: {
                        defaultResolution: '1920x1080',
                        defaultFps: 50,
                        defaultBitrate: '8000000',
                        defaultCodec: 'h264',
                        bufferSize: '10000000'
                    },
                    audio: {
                        channels: 2,
                        sampleRate: 48000,
                        bitrate: '192000',
                        codec: 'aac'
                    },
                    streaming: {
                        defaultProtocol: 'rtmp',
                        adaptiveBitrate: true,
                        redundancy: false,
                        maxRetries: 3
                    },
                    recording: {
                        defaultFormat: 'mp4',
                        defaultCodec: 'h264',
                        defaultPath: './recordings',
                        autoSegment: false
                    },
                    hardware: {
                        blackmagic: true,
                        ndi: true,
                        usb: true,
                        ipCameras: true
                    }
                };
                
                // Guardar configuración por defecto
                await this.saveConfig(this.config);
                console.log('📁 Default config created and saved');
            }
            
        } catch (error) {
            console.error('❌ Error loading config:', error);
            throw error;
        }
    }
    
    async detectHardware() {
        console.log('🔧 Detecting hardware...');
        
        try {
            // Simulación de detección de hardware
            // En implementación real, aquí iría la detección real
            
            const simulatedDevices = [
                {
                    id: 'device_blackmagic_1',
                    type: 'blackmagic',
                    name: 'Blackmagic DeckLink SDI',
                    model: 'DeckLink SDI 4K',
                    status: 'connected',
                    inputs: ['SDI 1', 'SDI 2'],
                    outputs: ['SDI Out 1', 'SDI Out 2'],
                    formats: ['1080p50', '1080p60', '4Kp30'],
                    serial: 'BMD-12345'
                },
                {
                    id: 'device_ndi_1',
                    type: 'ndi',
                    name: 'NDI Source',
                    status: 'available',
                    address: '192.168.1.100',
                    resolution: '1920x1080',
                    fps: 30,
                    audio: true
                },
                {
                    id: 'device_usb_1',
                    type: 'usb',
                    name: 'USB Webcam',
                    status: 'connected',
                    resolution: '1280x720',
                    fps: 30,
                    audio: true,
                    vendor: 'Logitech'
                }
            ];
            
            // Agregar al mapa de hardware
            simulatedDevices.forEach(device => {
                this.hardware.set(device.id, device);
            });
            
            console.log(`✅ Hardware detected: ${this.hardware.size} devices`);
            
            // Notificar a clientes
            this.broadcast({
                type: 'hardware_updated',
                devices: Array.from(this.hardware.values()),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error detecting hardware:', error);
        }
    }
    
    async loadInitialData() {
        console.log('📋 Loading initial data...');
        
        // Scenes de ejemplo
        const initialScenes = [
            {
                id: 'scene_default_1',
                name: 'Estudio Principal',
                description: 'Escena principal del estudio',
                layout: 'fullscreen',
                sources: [
                    { id: 'source_cam_1', type: 'video', x: 0, y: 0, width: 1920, height: 1080 },
                    { id: 'source_mic_1', type: 'audio', volume: 0.8, muted: false }
                ],
                transitions: ['cut', 'fade'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'scene_default_2',
                name: 'Doble Cámara',
                description: 'Dos cámaras en split screen',
                layout: 'split_horizontal',
                sources: [
                    { id: 'source_cam_1', type: 'video', x: 0, y: 0, width: 960, height: 1080 },
                    { id: 'source_cam_2', type: 'video', x: 960, y: 0, width: 960, height: 1080 },
                    { id: 'source_mic_1', type: 'audio', volume: 0.8, muted: false }
                ],
                transitions: ['cut', 'slide'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        // Sources de ejemplo
        const initialSources = [
            {
                id: 'source_cam_1',
                name: 'Cámara Estudio A',
                type: 'video',
                deviceId: 'device_blackmagic_1',
                devicePort: 'SDI 1',
                settings: {
                    resolution: '1920x1080',
                    fps: 50,
                    codec: 'raw',
                    colorSpace: 'bt709'
                },
                status: 'active'
            },
            {
                id: 'source_cam_2',
                name: 'Cámara Estudio B',
                type: 'video',
                deviceId: 'device_blackmagic_1',
                devicePort: 'SDI 2',
                settings: {
                    resolution: '1920x1080',
                    fps: 50,
                    codec: 'raw',
                    colorSpace: 'bt709'
                },
                status: 'active'
            },
            {
                id: 'source_mic_1',
                name: 'Micrófono Principal',
                type: 'audio',
                deviceId: 'system_default',
                settings: {
                    sampleRate: 48000,
                    channels: 2,
                    bitrate: 192000
                },
                status: 'active'
            }
        ];
        
        // Agregar a los mapas
        initialScenes.forEach(scene => {
            this.scenes.set(scene.id, scene);
        });
        
        initialSources.forEach(source => {
            this.sources.set(source.id, source);
        });
        
        console.log(`✅ Initial data loaded: ${this.scenes.size} scenes, ${this.sources.size} sources`);
    }
    
    async startStream(config) {
        const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🚀 Starting stream: ${streamId}`);
        
        const stream = {
            id: streamId,
            config: {
                ...config,
                id: streamId
            },
            status: 'starting',
            startTime: null,
            endTime: null,
            stats: {
                bitrate: 0,
                bitrateVideo: 0,
                bitrateAudio: 0,
                fps: 0,
                droppedFrames: 0,
                viewers: 0,
                latency: 0
            },
            destinations: config.destinations || [],
            errors: []
        };
        
        // Simular inicio de stream
        setTimeout(() => {
            stream.status = 'running';
            stream.startTime = new Date().toISOString();
            
            this.streams.set(streamId, stream);
            
            // Notificar a clientes
            this.broadcast({
                type: 'stream_started',
                stream: { ...stream },
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ Stream running: ${streamId}`);
            
            // Simular estadísticas en tiempo real
            this.simulateStreamStats(streamId);
            
        }, 1000);
        
        return streamId;
    }
    
    async stopStream(streamId) {
        const stream = this.streams.get(streamId);
        
        if (!stream) {
            throw new Error(`Stream ${streamId} not found`);
        }
        
        console.log(`🛑 Stopping stream: ${streamId}`);
        
        stream.status = 'stopping';
        
        // Simular detención
        setTimeout(() => {
            stream.status = 'stopped';
            stream.endTime = new Date().toISOString();
            
            // Notificar a clientes
            this.broadcast({
                type: 'stream_stopped',
                streamId,
                timestamp: new Date().toISOString(),
                duration: stream.startTime ? 
                    (new Date(stream.endTime) - new Date(stream.startTime)) / 1000 : 0
            });
            
            // Remover del mapa después de un tiempo
            setTimeout(() => {
                this.streams.delete(streamId);
            }, 5000);
            
            console.log(`✅ Stream stopped: ${streamId}`);
        }, 1000);
    }
    
    async startRecording(config) {
        const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🔴 Starting recording: ${recordId}`);
        
        const recording = {
            id: recordId,
            config: {
                ...config,
                id: recordId
            },
            status: 'recording',
            startTime: new Date().toISOString(),
            endTime: null,
            fileInfo: {
                path: config.path || './recordings',
                filename: `recording_${Date.now()}.mp4`,
                size: 0,
                duration: 0,
                format: config.format || 'mp4'
            },
            stats: {
                videoBitrate: 0,
                audioBitrate: 0,
                fps: 0,
                frameCount: 0
            }
        };
        
        this.recordings.set(recordId, recording);
        
        // Notificar a clientes
        this.broadcast({
            type: 'recording_started',
            recording: { ...recording },
            timestamp: new Date().toISOString()
        });
        
        // Simular crecimiento del archivo
        this.simulateRecordingStats(recordId);
        
        return recordId;
    }
    
    async stopRecording(recordId) {
        const recording = this.recordings.get(recordId);
        
        if (!recording) {
            throw new Error(`Recording ${recordId} not found`);
        }
        
        console.log(`⏹️ Stopping recording: ${recordId}`);
        
        recording.status = 'stopped';
        recording.endTime = new Date().toISOString();
        
        // Calcular duración final
        const start = new Date(recording.startTime);
        const end = new Date(recording.endTime);
        recording.fileInfo.duration = (end - start) / 1000;
        recording.fileInfo.size = Math.floor(recording.fileInfo.duration * 10000000); // 10MB/s
        
        // Notificar a clientes
        this.broadcast({
            type: 'recording_stopped',
            recordId,
            recording: { ...recording },
            timestamp: new Date().toISOString()
        });
        
        // Mantener en el mapa por un tiempo
        setTimeout(() => {
            this.recordings.delete(recordId);
        }, 30000);
        
        console.log(`✅ Recording stopped: ${recordId}`);
    }
    
    async saveScene(sceneData) {
        const sceneId = sceneData.id || `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const scene = {
            id: sceneId,
            ...sceneData,
            createdAt: sceneData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.scenes.set(sceneId, scene);
        
        // Notificar a clientes
        this.broadcast({
            type: 'scene_saved',
            scene: { ...scene },
            timestamp: new Date().toISOString()
        });
        
        console.log(`💾 Scene saved: ${sceneId}`);
        
        return scene;
    }
    
    async updateScene(sceneId, updates) {
        const scene = this.scenes.get(sceneId);
        
        if (!scene) {
            throw new Error(`Scene ${sceneId} not found`);
        }
        
        const updatedScene = {
            ...scene,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.scenes.set(sceneId, updatedScene);
        
        // Notificar a clientes
        this.broadcast({
            type: 'scene_updated',
            sceneId,
            scene: { ...updatedScene },
            timestamp: new Date().toISOString()
        });
        
        console.log(`✏️ Scene updated: ${sceneId}`);
    }
    
    async deleteScene(sceneId) {
        if (!this.scenes.has(sceneId)) {
            throw new Error(`Scene ${sceneId} not found`);
        }
        
        this.scenes.delete(sceneId);
        
        // Notificar a clientes
        this.broadcast({
            type: 'scene_deleted',
            sceneId,
            timestamp: new Date().toISOString()
        });
        
        console.log(`🗑️ Scene deleted: ${sceneId}`);
    }
    
    async addSource(sourceData) {
        const sourceId = sourceData.id || `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const source = {
            id: sourceId,
            ...sourceData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.sources.set(sourceId, source);
        
        // Notificar a clientes
        this.broadcast({
            type: 'source_added',
            source: { ...source },
            timestamp: new Date().toISOString()
        });
        
        console.log(`➕ Source added: ${sourceId}`);
        
        return source;
    }
    
    async performTransition(type, fromScene, toScene, duration = 1000) {
        console.log(`🔄 Performing transition: ${type} from ${fromScene} to ${toScene}`);
        
        // Notificar a clientes
        this.broadcast({
            type: 'transition_started',
            transition: {
                type,
                fromScene,
                toScene,
                duration,
                timestamp: new Date().toISOString()
            }
        });
        
        // Simular transición
        setTimeout(() => {
            this.broadcast({
                type: 'transition_completed',
                transition: {
                    type,
                    fromScene,
                    toScene,
                    duration,
                    timestamp: new Date().toISOString(),
                    completedAt: new Date().toISOString()
                }
            });
            
            console.log(`✅ Transition completed: ${type}`);
        }, duration);
    }
    
    async scanHardware() {
        console.log('🔍 Scanning for hardware...');
        
        // Simulación de escaneo
        // En implementación real, aquí escanearías dispositivos reales
        
        const newDevices = [
            {
                id: `device_new_${Date.now()}`,
                type: 'usb',
                name: 'New USB Camera',
                status: 'detected',
                resolution: '1920x1080',
                fps: 30
            }
        ];
        
        // Agregar nuevos dispositivos
        newDevices.forEach(device => {
            if (!this.hardware.has(device.id)) {
                this.hardware.set(device.id, device);
            }
        });
        
        const devices = Array.from(this.hardware.values());
        
        // Notificar a clientes
        this.broadcast({
            type: 'hardware_scanned',
            devices,
            timestamp: new Date().toISOString()
        });
        
        console.log(`🔍 Hardware scan complete: ${devices.length} devices`);
        
        return devices;
    }
    
    async saveConfig(config) {
        try {
            const configDir = path.join(__dirname, 'config');
            
            // Crear directorio si no existe
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            const configPath = path.join(configDir, 'defaults.json');
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            
            // Actualizar configuración en memoria
            this.config = config;
            
            // Notificar a clientes
            this.broadcast({
                type: 'config_updated',
                config: { ...config },
                timestamp: new Date().toISOString()
            });
            
            console.log('💾 Configuration saved');
            
        } catch (error) {
            console.error('❌ Error saving config:', error);
            throw error;
        }
    }
    
    loadConfig() {
        return this.config;
    }
    
    getSystemStats() {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        return {
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                uptime: Math.floor(uptime)
            },
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
            },
            resources: {
                streams: this.streams.size,
                recordings: this.recordings.size,
                scenes: this.scenes.size,
                sources: this.sources.size,
                hardware: this.hardware.size,
                clients: this.clients.size
            },
            performance: {
                cpuUsage: process.cpuUsage(),
                timestamp: new Date().toISOString()
            }
        };
    }
    
    async restartSystem() {
        console.log('🔄 Restarting system...');
        
        // Notificar a clientes
        this.broadcast({
            type: 'system_restarting',
            timestamp: new Date().toISOString(),
            message: 'System restart initiated'
        });
        
        // Cerrar todas las conexiones WebSocket
        this.wss.clients.forEach(client => {
            client.close(1001, 'Server restarting');
        });
        
        // Limpiar recursos
        this.streams.clear();
        this.recordings.clear();
        this.clients.clear();
        
        // Reiniciar después de un delay
        setTimeout(() => {
            console.log('✅ System restart complete');
        }, 1000);
    }
    
    simulateStreamStats(streamId) {
        const interval = setInterval(() => {
            const stream = this.streams.get(streamId);
            
            if (!stream || stream.status !== 'running') {
                clearInterval(interval);
                return;
            }
            
            // Actualizar estadísticas
            stream.stats = {
                bitrate: 5000000 + Math.random() * 3000000,
                bitrateVideo: 4500000 + Math.random() * 2500000,
                bitrateAudio: 192000,
                fps: 50 + Math.random() * 10,
                droppedFrames: stream.stats.droppedFrames + Math.floor(Math.random() * 3),
                viewers: stream.stats.viewers + Math.floor(Math.random() * 5),
                latency: 100 + Math.random() * 200
            };
            
            // Notificar a clientes
            this.broadcast({
                type: 'stream_stats',
                streamId,
                stats: { ...stream.stats },
                timestamp: new Date().toISOString()
            });
            
        }, 2000);
    }
    
    simulateRecordingStats(recordId) {
        const interval = setInterval(() => {
            const recording = this.recordings.get(recordId);
            
            if (!recording || recording.status !== 'recording') {
                clearInterval(interval);
                return;
            }
            
            // Actualizar estadísticas
            const now = new Date();
            const start = new Date(recording.startTime);
            const duration = (now - start) / 1000;
            
            recording.fileInfo.duration = duration;
            recording.fileInfo.size = Math.floor(duration * 10000000); // 10MB/s
            
            recording.stats = {
                videoBitrate: 5000000 + Math.random() * 2000000,
                audioBitrate: 192000,
                fps: 50,
                frameCount: Math.floor(duration * 50)
            };
            
            // Notificar a clientes
            this.broadcast({
                type: 'recording_stats',
                recordId,
                stats: { ...recording.stats },
                fileInfo: { ...recording.fileInfo },
                timestamp: new Date().toISOString()
            });
            
        }, 1000);
    }
    
    handleWebSocketMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'ping':
                    this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
                    break;
                    
                case 'get_status':
                    this.sendToClient(ws, {
                        type: 'system_status',
                        data: this.getSystemStats(),
                        timestamp: new Date().toISOString()
                    });
                    break;
                    
                case 'command':
                    this.handleClientCommand(ws, data);
                    break;
                    
                case 'subscribe':
                    this.handleSubscription(ws, data);
                    break;
                    
                case 'unsubscribe':
                    this.handleUnsubscription(ws, data);
                    break;
                    
                default:
                    console.log(`📨 Unknown WebSocket message type: ${data.type}`);
            }
        } catch (error) {
            console.error('❌ Error handling WebSocket message:', error);
            this.sendToClient(ws, {
                type: 'error',
                error: 'Invalid message format',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    handleClientCommand(ws, data) {
        const { command, params } = data;
        
        console.log(`⚡ Client command (${ws.clientId}): ${command}`);
        
        switch (command) {
            case 'start_stream':
                this.startStream(params).then(streamId => {
                    this.sendToClient(ws, {
                        type: 'command_response',
                        command: 'start_stream',
                        success: true,
                        streamId,
                        timestamp: new Date().toISOString()
                    });
                }).catch(error => {
                    this.sendToClient(ws, {
                        type: 'command_response',
                        command: 'start_stream',
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                });
                break;
                
            case 'stop_stream':
                this.stopStream(params.streamId).then(() => {
                    this.sendToClient(ws, {
                        type: 'command_response',
                        command: 'stop_stream',
                        success: true,
                        timestamp: new Date().toISOString()
                    });
                }).catch(error => {
                    this.sendToClient(ws, {
                        type: 'command_response',
                        command: 'stop_stream',
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                });
                break;
                
            case 'transition':
                this.performTransition(
                    params.type,
                    params.fromScene,
                    params.toScene,
                    params.duration
                ).then(() => {
                    this.sendToClient(ws, {
                        type: 'command_response',
                        command: 'transition',
                        success: true,
                        timestamp: new Date().toISOString()
                    });
                });
                break;
                
            default:
                this.sendToClient(ws, {
                    type: 'command_response',
                    command,
                    success: false,
                    error: 'Unknown command',
                    timestamp: new Date().toISOString()
                });
        }
    }
    
    handleSubscription(ws, data) {
        const { events } = data;
        
        if (!ws.subscriptions) {
            ws.subscriptions = new Set();
        }
        
        events.forEach(event => {
            ws.subscriptions.add(event);
        });
        
        this.sendToClient(ws, {
            type: 'subscription_confirmed',
            events: Array.from(ws.subscriptions),
            timestamp: new Date().toISOString()
        });
        
        console.log(`📡 Client ${ws.clientId} subscribed to: ${events.join(', ')}`);
    }
    
    handleUnsubscription(ws, data) {
        const { events } = data;
        
        if (ws.subscriptions) {
            events.forEach(event => {
                ws.subscriptions.delete(event);
            });
        }
        
        this.sendToClient(ws, {
            type: 'unsubscription_confirmed',
            events,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📡 Client ${ws.clientId} unsubscribed from: ${events.join(', ')}`);
    }
    
    broadcast(message) {
        const messageStr = JSON.stringify(message);
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                // Verificar suscripciones si las hay
                if (client.subscriptions && message.type) {
                    if (client.subscriptions.has(message.type) || 
                        client.subscriptions.has('all')) {
                        client.send(messageStr);
                    }
                } else {
                    // Enviar a todos si no hay suscripciones
                    client.send(messageStr);
                }
            }
        });
    }
    
    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log('='.repeat(60));
            console.log('🚀 TeleMaster Pro Server Started');
            console.log('='.repeat(60));
            console.log(`📡 HTTP Server: http://localhost:${this.port}`);
            console.log(`🔗 WebSocket Server: ws://localhost:${this.port}`);
            console.log(`📁 API Base: http://localhost:${this.port}/api`);
            console.log(`📊 Health Check: http://localhost:${this.port}/api/health`);
            console.log('='.repeat(60));
            console.log('Press Ctrl+C to stop the server');
            console.log('='.repeat(60));
        });
        
        // Manejar cierre elegante
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }
    
    shutdown() {
        console.log('\n🛑 Shutting down TeleMaster Pro Server...');
        
        // Notificar a clientes
        this.broadcast({
            type: 'server_shutdown',
            message: 'Server is shutting down',
            timestamp: new Date().toISOString()
        });
        
        // Cerrar WebSocket server
        this.wss.close(() => {
            console.log('✅ WebSocket server closed');
        });
        
        // Cerrar HTTP server
        this.server.close(() => {
            console.log('✅ HTTP server closed');
            console.log('👋 Goodbye!');
            process.exit(0);
        });
        
        // Forzar cierre después de 5 segundos
        setTimeout(() => {
            console.log('⚠️ Forcing shutdown...');
            process.exit(1);
        }, 5000);
    }
}

// Iniciar servidor si es el archivo principal
if (require.main === module) {
    const server = new TeleMasterServer();
}

module.exports = TeleMasterServer;

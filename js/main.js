/**
 * TeleMaster Pro - Sistema Principal
 * Archivo principal de inicialización y control
 */

class TeleMasterSystem {
    constructor() {
        this.config = {
            version: '1.0.0',
            debug: true,
            autoSave: true,
            autoConnect: true
        };
        
        this.state = {
            isInitialized: false,
            isStreaming: false,
            isRecording: false,
            isConnected: false,
            currentScene: null,
            previewScene: null,
            selectedSource: null,
            hardwareDetected: false
        };
        
        this.components = {
            multiviewer: null,
            audioMixer: null,
            sceneManager: null,
            streamEngine: null,
            hardwareManager: null
        };
        
        this.init();
    }
    
    /**
     * Inicialización del sistema
     */
    async init() {
        try {
            // Mostrar pantalla de carga
            this.showLoading();
            
            // Inicializar componentes
            await this.initComponents();
            
            // Cargar configuración
            await this.loadConfig();
            
            // Detectar hardware
            await this.detectHardware();
            
            // Conectar al servidor
            await this.connectToServer();
            
            // Configurar interfaz
            this.setupUI();
            
            // Iniciar monitoreo
            this.startMonitoring();
            
            // Ocultar pantalla de carga
            setTimeout(() => {
                this.hideLoading();
                this.state.isInitialized = true;
                this.showNotification('Sistema inicializado', 'TeleMaster Pro está listo para usar', 'success');
                console.log('✅ Sistema TeleMaster Pro inicializado');
            }, 1500);
            
        } catch (error) {
            console.error('❌ Error inicializando sistema:', error);
            this.showNotification('Error de inicialización', error.message, 'error');
        }
    }
    
    /**
     * Inicializar componentes del sistema
     */
    async initComponents() {
        // Inicializar gestor de hardware
        this.components.hardwareManager = new HardwareManager();
        
        // Inicializar multivisor
        this.components.multiviewer = new Multiviewer({
            container: '.main-area',
            layout: '2x2',
            boxes: 4
        });
        
        // Inicializar mezclador de audio
        this.components.audioMixer = new AudioMixer({
            container: '.audio-mixer',
            channels: 4
        });
        
        // Inicializar gestor de escenas
        this.components.sceneManager = new SceneManager();
        
        // Inicializar motor de streaming
        this.components.streamEngine = new StreamEngine();
        
        // Cargar datos de ejemplo
        await this.loadSampleData();
    }
    
    /**
     * Cargar configuración del sistema
     */
    async loadConfig() {
        try {
            // Intentar cargar configuración guardada
            const savedConfig = localStorage.getItem('telemaster-config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.config = { ...this.config, ...config };
                console.log('📁 Configuración cargada');
            }
            
            // Configuración por defecto
            const defaultConfig = {
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
                    adaptiveBitrate: true,
                    redundancy: false
                },
                recording: {
                    format: 'mp4',
                    codec: 'h264',
                    path: './recordings'
                }
            };
            
            // Combinar configuraciones
            this.config = { ...defaultConfig, ...this.config };
            
        } catch (error) {
            console.warn('⚠️ No se pudo cargar configuración:', error);
        }
    }
    
    /**
     * Detectar hardware disponible
     */
    async detectHardware() {
        try {
            const hardware = await this.components.hardwareManager.detect();
            
            if (hardware.devices.length > 0) {
                this.state.hardwareDetected = true;
                console.log('🔧 Hardware detectado:', hardware.devices);
                
                // Actualizar interfaz con hardware detectado
                this.updateHardwareUI(hardware.devices);
                
                this.showNotification(
                    'Hardware detectado',
                    `Se encontraron ${hardware.devices.length} dispositivos`,
                    'success'
                );
            } else {
                console.warn('⚠️ No se detectó hardware compatible');
                this.showNotification(
                    'Hardware no detectado',
                    'Conecta dispositivos de captura para comenzar',
                    'warning'
                );
            }
            
        } catch (error) {
            console.error('❌ Error detectando hardware:', error);
        }
    }
    
    /**
     * Conectar al servidor backend
     */
    async connectToServer() {
        try {
            const api = new TeleMasterAPI();
            const connected = await api.connect();
            
            if (connected) {
                this.state.isConnected = true;
                console.log('🔗 Conectado al servidor');
                
                // Suscribirse a eventos
                api.on('stream_update', this.handleStreamUpdate.bind(this));
                api.on('recording_update', this.handleRecordingUpdate.bind(this));
                api.on('hardware_update', this.handleHardwareUpdate.bind(this));
                
            } else {
                console.warn('⚠️ No se pudo conectar al servidor');
                this.showNotification(
                    'Servidor no disponible',
                    'Inicia el servidor backend para funciones completas',
                    'warning'
                );
            }
            
        } catch (error) {
            console.error('❌ Error conectando al servidor:', error);
        }
    }
    
    /**
     * Configurar interfaz de usuario
     */
    setupUI() {
        // Configurar eventos de botones
        this.setupButtonEvents();
        
        // Configurar arrastrar y soltar
        this.setupDragAndDrop();
        
        // Configurar atajos de teclado
        this.setupKeyboardShortcuts();
        
        // Actualizar estado inicial
        this.updateUIState();
    }
    
    /**
     * Configurar eventos de botones
     */
    setupButtonEvents() {
        // Botones de transición
        document.querySelectorAll('.transition-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type || e.target.closest('.transition-btn').dataset.type;
                this.performTransition(type);
            });
        });
        
        // Botones de control
        document.getElementById('btn-stream')?.addEventListener('click', () => this.toggleStream());
        document.getElementById('btn-record')?.addEventListener('click', () => this.toggleRecording());
        document.getElementById('btn-settings')?.addEventListener('click', () => this.openSettings());
        document.getElementById('btn-outputs')?.addEventListener('click', () => this.openOutputs());
        document.getElementById('btn-broadcast')?.addEventListener('click', () => this.openBroadcast());
        
        // Botones de escena
        document.querySelectorAll('.scene-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const sceneId = e.currentTarget.dataset.sceneId;
                this.setPreviewScene(sceneId);
            });
        });
        
        // Botones de fuente
        document.querySelectorAll('.source-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const sourceId = e.currentTarget.dataset.sourceId;
                this.selectSource(sourceId);
            });
        });
    }
    
    /**
     * Configurar arrastrar y soltar
     */
    setupDragAndDrop() {
        // Fuentes arrastrables
        const sources = document.querySelectorAll('.source-item');
        const multiviewer = document.querySelector('.multiviewer-container');
        
        sources.forEach(source => {
            source.setAttribute('draggable', 'true');
            
            source.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', source.dataset.sourceId);
                source.classList.add('dragging');
            });
            
            source.addEventListener('dragend', () => {
                source.classList.remove('dragging');
            });
        });
        
        // Zonas de destino
        if (multiviewer) {
            multiviewer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.currentTarget.classList.add('drag-over');
            });
            
            multiviewer.addEventListener('dragleave', (e) => {
                e.currentTarget.classList.remove('drag-over');
            });
            
            multiviewer.addEventListener('drop', (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                
                const sourceId = e.dataTransfer.getData('text/plain');
                const box = e.target.closest('.multiviewer-box');
                
                if (box && sourceId) {
                    const boxId = box.dataset.boxId;
                    this.assignSourceToBox(sourceId, boxId);
                }
            });
        }
    }
    
    /**
     * Configurar atajos de teclado
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Solo si no estamos en un input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Atajos con Ctrl
            if (e.ctrlKey) {
                switch(e.key) {
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                        const sceneIndex = parseInt(e.key) - 1;
                        this.recallScene(sceneIndex);
                        break;
                        
                    case ' ':
                        e.preventDefault();
                        this.performTransition('cut');
                        break;
                        
                    case 'Enter':
                        e.preventDefault();
                        this.performTransition('auto');
                        break;
                        
                    case 's':
                        e.preventDefault();
                        this.toggleStream();
                        break;
                        
                    case 'r':
                        e.preventDefault();
                        this.toggleRecording();
                        break;
                }
            }
            
            // Atajos sin Ctrl
            else {
                switch(e.key) {
                    case 'F1':
                        e.preventDefault();
                        this.openHelp();
                        break;
                        
                    case 'F2':
                        e.preventDefault();
                        this.openSettings();
                        break;
                        
                    case 'F5':
                        e.preventDefault();
                        this.reloadSources();
                        break;
                }
            }
        });
    }
    
    /**
     * Realizar transición
     */
    performTransition(type) {
        if (!this.state.previewScene) {
            this.showNotification('No hay escena en preview', 'Selecciona una escena primero', 'warning');
            return;
        }
        
        console.log(`🔄 Realizando transición: ${type}`);
        
        // Actualizar estado
        const previousScene = this.state.currentScene;
        this.state.currentScene = this.state.previewScene;
        
        // Actualizar interfaz
        this.updateMultiviewer();
        this.updateSceneList();
        
        // Enviar comando al servidor
        if (this.state.isConnected) {
            const api = new TeleMasterAPI();
            api.sendCommand('transition', {
                type: type,
                from: previousScene?.id,
                to: this.state.currentScene.id
            });
        }
        
        // Mostrar notificación
        this.showNotification(
            'Transición realizada',
            `De "${previousScene?.name}" a "${this.state.currentScene.name}"`,
            'success'
        );
    }
    
    /**
     * Alternar streaming
     */
    async toggleStream() {
        try {
            if (!this.state.isStreaming) {
                // Iniciar streaming
                await this.startStreaming();
            } else {
                // Detener streaming
                await this.stopStreaming();
            }
        } catch (error) {
            console.error('❌ Error en streaming:', error);
            this.showNotification('Error de streaming', error.message, 'error');
        }
    }
    
    /**
     * Iniciar streaming
     */
    async startStreaming() {
        console.log('🚀 Iniciando streaming...');
        
        // Validar que haya una escena activa
        if (!this.state.currentScene) {
            throw new Error('No hay escena activa para transmitir');
        }
        
        // Configuración de streaming
        const streamConfig = {
            scene: this.state.currentScene.id,
            destinations: this.config.streaming.destinations,
            video: this.config.video,
            audio: this.config.audio
        };
        
        // Enviar al servidor
        if (this.state.isConnected) {
            const api = new TeleMasterAPI();
            await api.startStreaming(streamConfig);
        }
        
        // Actualizar estado
        this.state.isStreaming = true;
        this.updateUIState();
        
        this.showNotification('Streaming iniciado', 'Transmisión en vivo activa', 'success');
    }
    
    /**
     * Detener streaming
     */
    async stopStreaming() {
        console.log('🛑 Deteniendo streaming...');
        
        // Enviar al servidor
        if (this.state.isConnected) {
            const api = new TeleMasterAPI();
            await api.stopStreaming();
        }
        
        // Actualizar estado
        this.state.isStreaming = false;
        this.updateUIState();
        
        this.showNotification('Streaming detenido', 'Transmisión finalizada', 'info');
    }
    
    /**
     * Alternar grabación
     */
    async toggleRecording() {
        try {
            if (!this.state.isRecording) {
                await this.startRecording();
            } else {
                await this.stopRecording();
            }
        } catch (error) {
            console.error('❌ Error en grabación:', error);
            this.showNotification('Error de grabación', error.message, 'error');
        }
    }
    
    /**
     * Iniciar grabación
     */
    async startRecording() {
        console.log('🔴 Iniciando grabación...');
        
        // Configuración de grabación
        const recordConfig = {
            scene: this.state.currentScene.id,
            format: this.config.recording.format,
            codec: this.config.recording.codec,
            path: this.config.recording.path,
            metadata: {
                title: `Grabación ${new Date().toISOString()}`,
                scene: this.state.currentScene?.name
            }
        };
        
        // Enviar al servidor
        if (this.state.isConnected) {
            const api = new TeleMasterAPI();
            await api.startRecording(recordConfig);
        }
        
        // Actualizar estado
        this.state.isRecording = true;
        this.updateUIState();
        
        this.showNotification('Grabación iniciada', 'Grabando en curso', 'success');
    }
    
    /**
     * Detener grabación
     */
    async stopRecording() {
        console.log('⏹️ Deteniendo grabación...');
        
        // Enviar al servidor
        if (this.state.isConnected) {
            const api = new TeleMasterAPI();
            await api.stopRecording();
        }
        
        // Actualizar estado
        this.state.isRecording = false;
        this.updateUIState();
        
        this.showNotification('Grabación detenida', 'Archivo guardado', 'info');
    }
    
    /**
     * Establecer escena en preview
     */
    setPreviewScene(sceneId) {
        const scene = this.components.sceneManager.getScene(sceneId);
        if (scene) {
            this.state.previewScene = scene;
            this.updateMultiviewer();
            this.updateSceneList();
            console.log(`📺 Escena en preview: ${scene.name}`);
        }
    }
    
    /**
     * Recordar escena por índice
     */
    recallScene(index) {
        const scenes = this.components.sceneManager.getScenes();
        if (index >= 0 && index < scenes.length) {
            this.setPreviewScene(scenes[index].id);
        }
    }
    
    /**
     * Seleccionar fuente
     */
    selectSource(sourceId) {
        this.state.selectedSource = sourceId;
        
        // Actualizar interfaz
        document.querySelectorAll('.source-item').forEach(item => {
            item.classList.toggle('active', item.dataset.sourceId === sourceId);
        });
        
        console.log(`🔘 Fuente seleccionada: ${sourceId}`);
    }
    
    /**
     * Asignar fuente a caja del multivisor
     */
    assignSourceToBox(sourceId, boxId) {
        console.log(`📦 Asignando fuente ${sourceId} a caja ${boxId}`);
        
        // Actualizar multivisor
        if (this.components.multiviewer) {
            this.components.multiviewer.assignSource(boxId, sourceId);
        }
        
        this.showNotification('Fuente asignada', `Caja ${boxId} actualizada`, 'success');
    }
    
    /**
     * Actualizar estado de la interfaz
     */
    updateUIState() {
        // Actualizar botón de streaming
        const streamBtn = document.getElementById('btn-stream');
        if (streamBtn) {
            streamBtn.classList.toggle('active', this.state.isStreaming);
            streamBtn.innerHTML = this.state.isStreaming ? 
                '<i class="fas fa-stop-circle"></i> DETENER STREAM' : 
                '<i class="fas fa-play-circle"></i> INICIAR STREAM';
        }
        
        // Actualizar botón de grabación
        const recordBtn = document.getElementById('btn-record');
        if (recordBtn) {
            recordBtn.classList.toggle('active', this.state.isRecording);
            recordBtn.innerHTML = this.state.isRecording ? 
                '<i class="fas fa-stop"></i> DETENER GRABACIÓN' : 
                '<i class="fas fa-circle"></i> INICIAR GRABACIÓN';
        }
        
        // Actualizar indicadores de estado
        const statusDot = document.querySelector('.status-dot');
        if (statusDot) {
            statusDot.classList.toggle('recording', this.state.isRecording);
            statusDot.classList.toggle('streaming', this.state.isStreaming);
            
            if (!this.state.isRecording && !this.state.isStreaming) {
                statusDot.style.backgroundColor = '';
            }
        }
        
        // Actualizar estadísticas
        this.updateStats();
    }
    
    /**
     * Actualizar multivisor
     */
    updateMultiviewer() {
        if (!this.components.multiviewer) return;
        
        // Actualizar caja de program
        if (this.state.currentScene) {
            this.components.multiviewer.updateBox('program', {
                label: 'PROGRAM',
                source: this.state.currentScene.name,
                tally: 'program'
            });
        }
        
        // Actualizar caja de preview
        if (this.state.previewScene) {
            this.components.multiviewer.updateBox('preview', {
                label: 'PREVIEW',
                source: this.state.previewScene.name,
                tally: 'preview'
            });
        }
    }
    
    /**
     * Actualizar lista de escenas
     */
    updateSceneList() {
        const sceneList = document.querySelector('.scene-list');
        if (!sceneList) return;
        
        const scenes = this.components.sceneManager.getScenes();
        sceneList.innerHTML = '';
        
        scenes.forEach((scene, index) => {
            const isCurrent = this.state.currentScene?.id === scene.id;
            const isPreview = this.state.previewScene?.id === scene.id;
            
            const sceneElement = document.createElement('div');
            sceneElement.className = `scene-item ${isPreview ? 'active' : ''}`;
            sceneElement.dataset.sceneId = scene.id;
            
            sceneElement.innerHTML = `
                <div class="scene-info">
                    <div class="scene-name">${scene.name}</div>
                    <div class="scene-sources">${scene.sources?.length || 0} fuentes</div>
                </div>
                <div class="scene-number">${index + 1}</div>
            `;
            
            sceneElement.addEventListener('click', () => this.setPreviewScene(scene.id));
            sceneList.appendChild(sceneElement);
        });
    }
    
    /**
     * Actualizar interfaz de hardware
     */
    updateHardwareUI(devices) {
        const sourcesContainer = document.getElementById('video-sources');
        if (!sourcesContainer) return;
        
        // Limpiar fuentes existentes
        sourcesContainer.innerHTML = '';
        
        // Agregar fuentes de hardware
        devices.forEach(device => {
            const sourceElement = document.createElement('div');
            sourceElement.className = 'source-item';
            sourceElement.dataset.sourceId = device.id;
            
            let icon = '📹';
            if (device.type.includes('audio')) icon = '🎤';
            if (device.type.includes('ndi')) icon = '🌐';
            if (device.type.includes('file')) icon = '📁';
            
            sourceElement.innerHTML = `
                <div class="source-icon">${icon}</div>
                <div class="source-info">
                    <div class="source-name">${device.name}</div>
                    <div class="source-details">${device.type} • ${device.resolution || ''}</div>
                </div>
                <div class="source-status live"></div>
            `;
            
            sourceElement.addEventListener('click', () => this.selectSource(device.id));
            sourcesContainer.appendChild(sourceElement);
        });
    }
    
    /**
     * Actualizar estadísticas
     */
    updateStats() {
        // Actualizar valores de estadísticas
        const stats = {
            fps: this.config.video.fps,
            bitrate: '8 Mbps',
            latency: '2 ms',
            sources: this.components.sceneManager.getSourcesCount() || 0
        };
        
        // Actualizar elementos DOM
        Object.keys(stats).forEach(stat => {
            const element = document.querySelector(`.stat-${stat}`);
            if (element) {
                element.textContent = stats[stat];
            }
        });
    }
    
    /**
     * Mostrar notificación
     */
    showNotification(title, message, type = 'info') {
        const notificationContainer = document.querySelector('.notification-container') || 
                                     this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Botón para cerrar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        notificationContainer.appendChild(notification);
    }
    
    /**
     * Crear contenedor de notificaciones
     */
    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }
    
    /**
     * Mostrar pantalla de carga
     */
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }
    
    /**
     * Ocultar pantalla de carga
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }
    
    /**
     * Cargar datos de ejemplo
     */
    async loadSampleData() {
        // Escenas de ejemplo
        const sampleScenes = [
            {
                id: 'scene-1',
                name: 'Estudio Principal',
                sources: ['cam-1', 'mic-1', 'lower-third-1'],
                layout: 'fullscreen'
            },
            {
                id: 'scene-2',
                name: 'Cámara 2 Close-up',
                sources: ['cam-2', 'mic-1'],
                layout: 'fullscreen'
            },
            {
                id: 'scene-3',
                name: 'Doble Cámara',
                sources: ['cam-1', 'cam-2', 'mic-1'],
                layout: 'split-horizontal'
            }
        ];
        
        // Agregar escenas
        sampleScenes.forEach(scene => {
            this.components.sceneManager.addScene(scene);
        });
        
        // Establecer escenas iniciales
        this.state.currentScene = sampleScenes[0];
        this.state.previewScene = sampleScenes[1];
        
        console.log('📋 Datos de ejemplo cargados');
    }
    
    /**
     * Iniciar monitoreo del sistema
     */
    startMonitoring() {
        // Monitorear uso de CPU (simulado)
        setInterval(() => {
            this.updateSystemStats();
        }, 5000);
        
        // Monitorear conexión
        setInterval(() => {
            this.checkConnection();
        }, 10000);
    }
    
    /**
     * Actualizar estadísticas del sistema
     */
    updateSystemStats() {
        // Simular estadísticas del sistema
        const stats = {
            cpu: Math.floor(Math.random() * 30) + 10,
            memory: Math.floor(Math.random() * 40) + 30,
            network: Math.floor(Math.random() * 20) + 5
        };
        
        // Actualizar en interfaz si hay elementos correspondientes
        // (esto es opcional, dependiendo de tu diseño)
    }
    
    /**
     * Verificar conexión
     */
    async checkConnection() {
        if (this.state.isConnected) {
            try {
                const api = new TeleMasterAPI();
                const isAlive = await api.ping();
                
                if (!isAlive) {
                    this.state.isConnected = false;
                    console.warn('⚠️ Conexión perdida con el servidor');
                }
            } catch (error) {
                this.state.isConnected = false;
                console.warn('⚠️ No se pudo verificar conexión:', error);
            }
        }
    }
    
    /**
     * Manejar actualización de streaming
     */
    handleStreamUpdate(data) {
        console.log('📡 Actualización de streaming:', data);
        // Actualizar interfaz según datos recibidos
    }
    
    /**
     * Manejar actualización de grabación
     */
    handleRecordingUpdate(data) {
        console.log('📼 Actualización de grabación:', data);
        // Actualizar interfaz según datos recibidos
    }
    
    /**
     * Manejar actualización de hardware
     */
    handleHardwareUpdate(data) {
        console.log('🔧 Actualización de hardware:', data);
        this.updateHardwareUI(data.devices || []);
    }
    
    /**
     * Abrir configuración
     */
    openSettings() {
        console.log('⚙️ Abriendo configuración');
        // Implementar modal de configuración
        this.showNotification('Configuración', 'Panel de configuración (en desarrollo)', 'info');
    }
    
    /**
     * Abrir salidas
     */
    openOutputs() {
        console.log('🔌 Abriendo configuración de salidas');
        // Implementar modal de salidas
        this.showNotification('Salidas', 'Configuración de salidas (en desarrollo)', 'info');
    }
    
    /**
     * Abrir transmisión
     */
    openBroadcast() {
        console.log('📡 Abriendo panel de transmisión');
        // Implementar modal de transmisión
        this.showNotification('Transmisión', 'Panel de transmisión (en desarrollo)', 'info');
    }
    
    /**
     * Abrir ayuda
     */
    openHelp() {
        console.log('❓ Abriendo ayuda');
        // Implementar modal de ayuda
        this.showNotification('Ayuda', 'Documentación y ayuda (en desarrollo)', 'info');
    }
    
    /**
     * Recargar fuentes
     */
    reloadSources() {
        console.log('🔄 Recargando fuentes');
        this.detectHardware();
        this.showNotification('Fuentes recargadas', 'Buscando dispositivos disponibles', 'info');
    }
}

// Clases auxiliares (definiciones básicas)
class HardwareManager {
    async detect() {
        // Simulación de detección de hardware
        return {
            devices: [
                { id: 'cam-1', name: 'Cámara Studio A', type: 'blackmagic', resolution: '1080p50' },
                { id: 'cam-2', name: 'Cámara Studio B', type: 'blackmagic', resolution: '1080p50' },
                { id: 'mic-1', name: 'Micrófono Principal', type: 'audio', channels: 2 },
                { id: 'ndi-1', name: 'PC Presentación', type: 'ndi', resolution: '1080p30' }
            ]
        };
    }
}

class Multiviewer {
    constructor(config) {
        this.config = config;
        this.boxes = {};
        this.init();
    }
    
    init() {
        console.log('🖥️ Multivisor inicializado');
    }
    
    updateBox(boxId, data) {
        this.boxes[boxId] = data;
        // Actualizar DOM
        const boxElement = document.querySelector(`[data-box-id="${boxId}"]`);
        if (boxElement) {
            boxElement.querySelector('.box-source').textContent = data.source;
        }
    }
    
    assignSource(boxId, sourceId) {
        console.log(`Asignando ${sourceId} a ${boxId}`);
        // Implementar lógica de asignación
    }
}

class AudioMixer {
    constructor(config) {
        this.config = config;
        this.channels = {};
        this.init();
    }
    
    init() {
        console.log('🎚️ Mezclador de audio inicializado');
    }
}

class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.sources = new Map();
    }
    
    addScene(scene) {
        this.scenes.set(scene.id, scene);
    }
    
    getScene(sceneId) {
        return this.scenes.get(sceneId);
    }
    
    getScenes() {
        return Array.from(this.scenes.values());
    }
    
    getSourcesCount() {
        return this.sources.size;
    }
}

class StreamEngine {
    constructor() {
        console.log('🌐 Motor de streaming inicializado');
    }
}

class TeleMasterAPI {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.listeners = new Map();
    }
    
    async connect() {
        // Simulación de conexión
        return new Promise((resolve) => {
            setTimeout(() => {
                this.connected = true;
                resolve(true);
            }, 500);
        });
    }
    
    async startStreaming(config) {
        console.log('API: Iniciando streaming', config);
        return true;
    }
    
    async stopStreaming() {
        console.log('API: Deteniendo streaming');
        return true;
    }
    
    async startRecording(config) {
        console.log('API: Iniciando grabación', config);
        return true;
    }
    
    async stopRecording() {
        console.log('API: Deteniendo grabación');
        return true;
    }
    
    async sendCommand(command, data) {
        console.log(`API: Comando ${command}`, data);
        return true;
    }
    
    async ping() {
        return this.connected;
    }
    
    on(event, callback) {
        this.listeners.set(event, callback);
    }
}

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.teleMaster = new TeleMasterSystem();
    
    // Hacer disponible globalmente para debugging
    console.log('🎬 TeleMaster Pro listo');
    console.log('💡 Usa window.teleMaster para acceder al sistema');
});

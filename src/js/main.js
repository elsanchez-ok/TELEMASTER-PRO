// En src/js/main.js agregar esto después de la clase TeleMasterSystem

// Inicializar controles cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeControls();
    setupEventListeners();
    startClock();
    updateSystemStats();
});

function initializeControls() {
    console.log('🎮 Inicializando controles...');
    
    // Inicializar pestañas
    initializeTabs();
    
    // Inicializar botones de transición
    initializeTransitionButtons();
    
    // Inicializar controles de audio
    initializeAudioControls();
    
    // Inicializar controles de streaming
    initializeStreamingControls();
    
    // Inicializar controles de grabación
    initializeRecordingControls();
    
    // Inicializar controles de escenas
    initializeSceneControls();
    
    // Inicializar controles del multivisor
    initializeMultiviewerControls();
    
    // Inicializar controles de transporte
    initializeTransportControls();
    
    console.log('✅ Controles inicializados');
}

function setupEventListeners() {
    // Atajos de teclado globales
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // Eventos de red
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // Eventos de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remover clase active de todos los botones
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Remover clase active de todos los contenidos
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Mostrar el contenido correspondiente
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}

function initializeTransitionButtons() {
    const cutBtn = document.getElementById('btn-cut');
    const autoBtn = document.getElementById('btn-auto');
    const fadeBtn = document.getElementById('btn-fade');
    const previewBtn = document.getElementById('btn-preview');
    
    if (cutBtn) {
        cutBtn.addEventListener('click', () => performTransition('cut'));
    }
    
    if (autoBtn) {
        autoBtn.addEventListener('click', () => performTransition('auto'));
    }
    
    if (fadeBtn) {
        fadeBtn.addEventListener('click', () => performTransition('fade'));
    }
    
    if (previewBtn) {
        previewBtn.addEventListener('click', previewTransition);
    }
    
    // Control de duración de transición
    const durationSlider = document.getElementById('transitionDuration');
    const durationValue = document.getElementById('durationValue');
    
    if (durationSlider && durationValue) {
        durationSlider.addEventListener('input', function() {
            const value = this.value;
            durationValue.textContent = (value / 1000).toFixed(1) + 's';
        });
    }
}

function initializeAudioControls() {
    // Controles de volumen maestro
    const masterVolume = document.getElementById('masterVolume');
    const volumeValue = masterVolume?.parentElement?.querySelector('.volume-value');
    
    if (masterVolume && volumeValue) {
        masterVolume.addEventListener('input', function() {
            volumeValue.textContent = this.value + '%';
            // Aquí iría la lógica para cambiar el volumen maestro
            console.log('Volumen maestro:', this.value + '%');
        });
    }
    
    // Botón de mute maestro
    const muteMasterBtn = document.getElementById('btn-mute-master');
    if (muteMasterBtn) {
        muteMasterBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            const isMuted = this.classList.contains('active');
            this.innerHTML = isMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
            console.log('Master mute:', isMuted);
        });
    }
    
    // Controles de canales de audio
    const channelFaders = document.querySelectorAll('.volume-fader');
    channelFaders.forEach(fader => {
        fader.addEventListener('input', function() {
            const channel = this.closest('.audio-channel');
            const volumeDisplay = channel?.querySelector('.volume-display');
            if (volumeDisplay) {
                volumeDisplay.textContent = this.value + '%';
            }
            console.log('Volumen canal:', this.value + '%');
        });
    });
    
    // Botones de mute y solo
    const muteButtons = document.querySelectorAll('.mute-btn');
    const soloButtons = document.querySelectorAll('.solo-btn');
    
    muteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const channel = this.closest('.audio-channel');
            const channelName = channel?.querySelector('.channel-name')?.textContent;
            console.log('Mute channel:', channelName, this.classList.contains('active'));
        });
    });
    
    soloButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const channel = this.closest('.audio-channel');
            const channelName = channel?.querySelector('.channel-name')?.textContent;
            console.log('Solo channel:', channelName, this.classList.contains('active'));
        });
    });
}

function initializeStreamingControls() {
    const startBtn = document.getElementById('btn-start-stream');
    const stopBtn = document.getElementById('btn-stop-stream');
    const statusDot = document.getElementById('streamStatusDot');
    const statusText = document.getElementById('streamStatusText');
    
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            console.log('🚀 Iniciando stream...');
            // Simular inicio de stream
            startBtn.classList.add('disabled');
            stopBtn.classList.remove('disabled');
            
            if (statusDot) statusDot.style.backgroundColor = '#4CAF50';
            if (statusText) statusText.textContent = 'Transmitiendo';
            
            // Simular estadísticas
            simulateStreamStats();
            
            // Mostrar notificación
            showNotification('Stream iniciado', 'Transmisión en vivo activa', 'success');
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            console.log('🛑 Deteniendo stream...');
            // Simular detención de stream
            startBtn.classList.remove('disabled');
            stopBtn.classList.add('disabled');
            
            if (statusDot) statusDot.style.backgroundColor = '#666';
            if (statusText) statusText.textContent = 'Desconectado';
            
            // Detener simulación de estadísticas
            if (window.streamStatsInterval) {
                clearInterval(window.streamStatsInterval);
            }
            
            // Mostrar notificación
            showNotification('Stream detenido', 'Transmisión finalizada', 'info');
        });
    }
    
    // Botón para agregar destino
    const addDestinationBtn = document.getElementById('btn-add-destination');
    if (addDestinationBtn) {
        addDestinationBtn.addEventListener('click', () => {
            console.log('➕ Agregando destino de stream...');
            // Aquí iría la lógica para agregar un nuevo destino
        });
    }
}

function initializeRecordingControls() {
    const startBtn = document.getElementById('btn-start-recording');
    const stopBtn = document.getElementById('btn-stop-recording');
    const pauseBtn = document.getElementById('btn-pause-recording');
    const statusDot = document.getElementById('recordingStatusDot');
    const statusText = document.getElementById('recordingStatusText');
    const durationDisplay = document.getElementById('recordingDuration');
    const sizeDisplay = document.getElementById('recordingSize');
    
    let recordingInterval;
    let recordingSeconds = 0;
    let recordingSize = 0;
    
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            console.log('🔴 Iniciando grabación...');
            
            // Iniciar grabación
            startBtn.classList.add('disabled');
            stopBtn.classList.remove('disabled');
            pauseBtn.classList.remove('disabled');
            
            if (statusDot) {
                statusDot.style.backgroundColor = '#F44336';
                statusDot.classList.add('recording');
            }
            if (statusText) statusText.textContent = 'Grabando';
            
            // Iniciar temporizador
            recordingSeconds = 0;
            recordingSize = 0;
            
            recordingInterval = setInterval(() => {
                recordingSeconds++;
                recordingSize += 10; // 10MB por segundo
                
                if (durationDisplay) {
                    const hours = Math.floor(recordingSeconds / 3600);
                    const minutes = Math.floor((recordingSeconds % 3600) / 60);
                    const seconds = recordingSeconds % 60;
                    durationDisplay.textContent = 
                        `${hours.toString().padStart(2, '0')}:` +
                        `${minutes.toString().padStart(2, '0')}:` +
                        `${seconds.toString().padStart(2, '0')}`;
                }
                
                if (sizeDisplay) {
                    sizeDisplay.textContent = `${recordingSize} MB`;
                }
            }, 1000);
            
            // Mostrar notificación
            showNotification('Grabación iniciada', 'Grabando en curso', 'success');
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            console.log('⏹️ Deteniendo grabación...');
            
            // Detener grabación
            startBtn.classList.remove('disabled');
            stopBtn.classList.add('disabled');
            pauseBtn.classList.add('disabled');
            
            if (statusDot) {
                statusDot.style.backgroundColor = '#666';
                statusDot.classList.remove('recording');
            }
            if (statusText) statusText.textContent = 'Inactivo';
            
            // Detener temporizador
            if (recordingInterval) {
                clearInterval(recordingInterval);
            }
            
            // Mostrar notificación
            showNotification('Grabación detenida', `Archivo guardado (${recordingSize} MB)`, 'info');
        });
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
            const isPaused = this.classList.contains('active');
            
            if (isPaused) {
                // Reanudar
                console.log('▶️ Reanudando grabación...');
                this.classList.remove('active');
                this.innerHTML = '<i class="fas fa-pause"></i><span>PAUSAR</span>';
                
                if (statusText) statusText.textContent = 'Grabando';
                
                // Reanudar temporizador
                recordingInterval = setInterval(() => {
                    recordingSeconds++;
                    recordingSize += 10;
                    
                    if (durationDisplay) {
                        const hours = Math.floor(recordingSeconds / 3600);
                        const minutes = Math.floor((recordingSeconds % 3600) / 60);
                        const seconds = recordingSeconds % 60;
                        durationDisplay.textContent = 
                            `${hours.toString().padStart(2, '0')}:` +
                            `${minutes.toString().padStart(2, '0')}:` +
                            `${seconds.toString().padStart(2, '0')}`;
                    }
                    
                    if (sizeDisplay) {
                        sizeDisplay.textContent = `${recordingSize} MB`;
                    }
                }, 1000);
                
            } else {
                // Pausar
                console.log('⏸️ Pausando grabación...');
                this.classList.add('active');
                this.innerHTML = '<i class="fas fa-play"></i><span>REANUDAR</span>';
                
                if (statusText) statusText.textContent = 'Pausado';
                
                // Pausar temporizador
                if (recordingInterval) {
                    clearInterval(recordingInterval);
                }
            }
        });
    }
}

function initializeSceneControls() {
    const scenes = document.querySelectorAll('.scene-item');
    const addSceneBtn = document.getElementById('btn-add-scene');
    const duplicateSceneBtn = document.getElementById('btn-duplicate-scene');
    
    // Selección de escenas
    scenes.forEach(scene => {
        scene.addEventListener('click', function() {
            // Remover active de todas las escenas
            scenes.forEach(s => s.classList.remove('active'));
            // Agregar active a la escena clickeada
            this.classList.add('active');
            
            const sceneId = this.getAttribute('data-scene-id');
            const sceneName = this.querySelector('.scene-name')?.textContent;
            
            console.log(`📺 Escena seleccionada: ${sceneName} (${sceneId})`);
            
            // Actualizar display de program
            const programDisplay = document.getElementById('currentProgram');
            if (programDisplay) {
                programDisplay.textContent = sceneName;
            }
        });
    });
    
    // Botones de acciones de escena
    const previewButtons = document.querySelectorAll('.preview-btn');
    const programButtons = document.querySelectorAll('.program-btn');
    
    previewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const scene = this.closest('.scene-item');
            const sceneName = scene?.querySelector('.scene-name')?.textContent;
            console.log(`👁️ Previsualizando escena: ${sceneName}`);
        });
    });
    
    programButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const scene = this.closest('.scene-item');
            const sceneId = scene?.getAttribute('data-scene-id');
            const sceneName = scene?.querySelector('.scene-name')?.textContent;
            
            // Cambiar a program
            scenes.forEach(s => s.classList.remove('active'));
            scene.classList.add('active');
            
            console.log(`🎬 Cambiando a program: ${sceneName}`);
            
            // Actualizar display
            const programDisplay = document.getElementById('currentProgram');
            if (programDisplay) {
                programDisplay.textContent = sceneName;
            }
        });
    });
    
    if (addSceneBtn) {
        addSceneBtn.addEventListener('click', () => {
            console.log('➕ Agregando nueva escena...');
            // Aquí iría la lógica para agregar escena
        });
    }
    
    if (duplicateSceneBtn) {
        duplicateSceneBtn.addEventListener('click', () => {
            console.log('📋 Duplicando escena...');
            // Aquí iría la lógica para duplicar escena
        });
    }
}

function initializeMultiviewerControls() {
    // Selector de layout
    const layoutButtons = document.querySelectorAll('.layout-btn');
    const multiviewer = document.getElementById('multiviewer');
    
    layoutButtons.forEach(button => {
        button.addEventListener('click', function() {
            const layout = this.getAttribute('data-layout');
            
            // Remover active de todos los botones
            layoutButtons.forEach(btn => btn.classList.remove('active'));
            // Agregar active al botón clickeado
            this.classList.add('active');
            
            // Cambiar layout del multivisor
            if (multiviewer) {
                multiviewer.className = 'multiviewer-container';
                multiviewer.classList.add(`${layout}-layout`);
                
                // Actualizar grid CSS según el layout
                switch(layout) {
                    case '2x2':
                        multiviewer.style.gridTemplateColumns = 'repeat(2, 1fr)';
                        multiviewer.style.gridTemplateRows = 'repeat(2, 1fr)';
                        break;
                    case '1+3':
                        multiviewer.style.gridTemplateColumns = '2fr 1fr';
                        multiviewer.style.gridTemplateRows = '1fr 1fr';
                        break;
                    case '1+1':
                        multiviewer.style.gridTemplateColumns = '1fr 1fr';
                        multiviewer.style.gridTemplateRows = '1fr';
                        break;
                    case 'full':
                        multiviewer.style.gridTemplateColumns = '1fr';
                        multiviewer.style.gridTemplateRows = '1fr';
                        break;
                }
                
                console.log(`🖥️ Layout cambiado a: ${layout}`);
            }
        });
    });
    
    // Controles del multivisor
    const snapshotBtn = document.getElementById('btn-snapshot');
    const zoomBtn = document.getElementById('btn-zoom');
    const gridBtn = document.getElementById('btn-grid');
    
    if (snapshotBtn) {
        snapshotBtn.addEventListener('click', () => {
            console.log('📸 Capturando snapshot...');
            // Aquí iría la lógica para capturar snapshot
        });
    }
    
    if (zoomBtn) {
        zoomBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            const isZoomed = this.classList.contains('active');
            console.log('🔍 Zoom:', isZoomed ? 'activado' : 'desactivado');
        });
    }
    
    if (gridBtn) {
        gridBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            const showGrid = this.classList.contains('active');
            if (multiviewer) {
                multiviewer.classList.toggle('show-grid', showGrid);
            }
            console.log('📐 Grid:', showGrid ? 'mostrando' : 'ocultando');
        });
    }
}

function initializeTransportControls() {
    const playBtn = document.getElementById('btn-play');
    const pauseBtn = document.getElementById('btn-pause');
    const stopBtn = document.getElementById('btn-stop');
    const rewindBtn = document.getElementById('btn-rewind');
    const forwardBtn = document.getElementById('btn-forward');
    const loopBtn = document.getElementById('btn-loop');
    const emergencyBtn = document.getElementById('btn-emergency');
    const blackoutBtn = document.getElementById('btn-blackout');
    const freezeBtn = document.getElementById('btn-freeze');
    
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            console.log('▶️ Reproduciendo...');
            playBtn.classList.add('active');
            pauseBtn.classList.remove('active');
            stopBtn.classList.remove('active');
            // Aquí iría la lógica de reproducción
        });
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            console.log('⏸️ Pausando...');
            pauseBtn.classList.add('active');
            playBtn.classList.remove('active');
            // Aquí iría la lógica de pausa
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            console.log('⏹️ Deteniendo...');
            stopBtn.classList.add('active');
            playBtn.classList.remove('active');
            pauseBtn.classList.remove('active');
            // Aquí iría la lógica de stop
        });
    }
    
    if (rewindBtn) {
        rewindBtn.addEventListener('click', () => {
            console.log('⏪ Retrocediendo...');
            // Aquí iría la lógica de rewind
        });
    }
    
    if (forwardBtn) {
        forwardBtn.addEventListener('click', () => {
            console.log('⏩ Adelantando...');
            // Aquí iría la lógica de forward
        });
    }
    
    if (loopBtn) {
        loopBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            const isLooping = this.classList.contains('active');
            console.log('🔁 Loop:', isLooping ? 'activado' : 'desactivado');
        });
    }
    
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', () => {
            console.log('🚨 CORTE DE EMERGENCIA ACTIVADO');
            // Aquí iría la lógica de corte de emergencia
            showNotification('CORTE DE EMERGENCIA', 'Sistema en modo emergencia', 'error');
        });
    }
    
    if (blackoutBtn) {
        blackoutBtn.addEventListener('click', () => {
            console.log('🌑 BLACKOUT activado');
            // Aquí iría la lógica de blackout
            showNotification('Blackout', 'Salida en negro', 'warning');
        });
    }
    
    if (freezeBtn) {
        freezeBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            const isFrozen = this.classList.contains('active');
            console.log('❄️ Freeze:', isFrozen ? 'activado' : 'desactivado');
            showNotification('Freeze', isFrozen ? 'Imagen congelada' : 'Imagen normal', 'info');
        });
    }
}

function performTransition(type) {
    console.log(`🔄 Realizando transición: ${type}`);
    
    // Obtener escenas actuales
    const activeScene = document.querySelector('.scene-item.active');
    const previewScene = document.querySelector('.scene-item:not(.active)');
    
    if (!activeScene || !previewScene) {
        console.warn('No hay suficiente escenas para transición');
        return;
    }
    
    const fromScene = activeScene.querySelector('.scene-name')?.textContent;
    const toScene = previewScene.querySelector('.scene-name')?.textContent;
    
    // Animación visual de transición
    const programBox = document.querySelector('.program-box .box-content');
    const previewBox = document.querySelector('.preview-box .box-content');
    
    if (programBox && previewBox) {
        // Efecto visual según el tipo de transición
        switch(type) {
            case 'cut':
                // Corte instantáneo
                programBox.style.opacity = '0';
                setTimeout(() => {
                    programBox.style.opacity = '1';
                }, 50);
                break;
                
            case 'fade':
                // Fundido
                programBox.style.transition = 'opacity 0.5s';
                programBox.style.opacity = '0';
                setTimeout(() => {
                    programBox.style.opacity = '1';
                    programBox.style.transition = '';
                }, 500);
                break;
                
            case 'slide':
                // Deslizar
                programBox.style.transition = 'transform 0.5s';
                programBox.style.transform = 'translateX(-100%)';
                setTimeout(() => {
                    programBox.style.transform = 'translateX(0)';
                    programBox.style.transition = '';
                }, 500);
                break;
        }
    }
    
    // Actualizar escenas
    activeScene.classList.remove('active');
    previewScene.classList.add('active');
    
    // Actualizar display de program
    const programDisplay = document.getElementById('currentProgram');
    if (programDisplay) {
        programDisplay.textContent = toScene;
    }
    
    console.log(`✅ Transición ${type} completada: ${fromScene} → ${toScene}`);
    
    // Mostrar notificación
    showNotification(
        `Transición ${type}`,
        `De "${fromScene}" a "${toScene}"`,
        'success'
    );
}

function previewTransition() {
    console.log('👁️ Previsualizando transición...');
    // Aquí iría la lógica para previsualizar transición
    showNotification('Previsualización', 'Vista previa de transición', 'info');
}

function simulateStreamStats() {
    // Simular estadísticas de stream en tiempo real
    const bitrateDisplay = document.getElementById('streamBitrate');
    const fpsDisplay = document.getElementById('streamFps');
    const latencyDisplay = document.getElementById('streamLatency');
    const droppedDisplay = document.getElementById('streamDropped');
    
    let bitrate = 5000;
    let fps = 50;
    let latency = 100;
    let dropped = 0;
    
    if (window.streamStatsInterval) {
        clearInterval(window.streamStatsInterval);
    }
    
    window.streamStatsInterval = setInterval(() => {
        // Variar estadísticas de manera realista
        bitrate = 4500 + Math.random() * 1000;
        fps = 48 + Math.random() * 4;
        latency = 80 + Math.random() * 40;
        dropped += Math.floor(Math.random() * 2);
        
        if (bitrateDisplay) {
            bitrateDisplay.textContent = (bitrate / 1000).toFixed(1) + ' Mbps';
        }
        
        if (fpsDisplay) {
            fpsDisplay.textContent = Math.round(fps);
        }
        
        if (latencyDisplay) {
            latencyDisplay.textContent = Math.round(latency) + 'ms';
        }
        
        if (droppedDisplay) {
            droppedDisplay.textContent = dropped;
        }
    }, 2000);
}

function startClock() {
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const timeDisplay = document.getElementById('currentTime');
        if (timeDisplay) {
            timeDisplay.textContent = timeString;
        }
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

function updateSystemStats() {
    // Simular estadísticas del sistema
    function updateStats() {
        const cpuUsage = document.getElementById('cpuUsage');
        const memoryUsage = document.getElementById('memoryUsage');
        const networkUsage = document.getElementById('networkUsage');
        const footerCpu = document.getElementById('footerCpu');
        const footerMem = document.getElementById('footerMem');
        const footerGpu = document.getElementById('footerGpu');
        const footerNet = document.getElementById('footerNet');
        
        // Valores simulados (en producción serían valores reales)
        const cpu = 15 + Math.random() * 20;
        const mem = 40 + Math.random() * 20;
        const gpu = 10 + Math.random() * 15;
        const net = 500 + Math.random() * 1500;
        
        if (cpuUsage) cpuUsage.textContent = Math.round(cpu) + '%';
        if (memoryUsage) memoryUsage.textContent = Math.round(mem) + '%';
        if (networkUsage) networkUsage.textContent = Math.round(net) + 'kb/s';
        if (footerCpu) footerCpu.textContent = Math.round(cpu) + '%';
        if (footerMem) footerMem.textContent = Math.round(mem) + '%';
        if (footerGpu) footerGpu.textContent = Math.round(gpu) + '%';
        if (footerNet) footerNet.textContent = Math.round(net) + 'kb/s';
    }
    
    updateStats();
    setInterval(updateStats, 3000);
}

function handleGlobalKeydown(e) {
    // Solo si no estamos en un input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }
    
    // Atajos con Ctrl
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                e.preventDefault();
                const sceneIndex = parseInt(e.key) - 1;
                recallScene(sceneIndex);
                break;
                
            case ' ':
                e.preventDefault();
                performTransition('cut');
                break;
                
            case 'enter':
                e.preventDefault();
                performTransition('auto');
                break;
                
            case 's':
                e.preventDefault();
                const streamBtn = document.getElementById('btn-start-stream');
                if (streamBtn && !streamBtn.classList.contains('disabled')) {
                    streamBtn.click();
                }
                break;
                
            case 'r':
                e.preventDefault();
                const recordBtn = document.getElementById('btn-start-recording');
                if (recordBtn && !recordBtn.classList.contains('disabled')) {
                    recordBtn.click();
                }
                break;
                
            case 'b':
                e.preventDefault();
                const blackoutBtn = document.getElementById('btn-blackout');
                if (blackoutBtn) blackoutBtn.click();
                break;
                
            case 'f':
                e.preventDefault();
                const freezeBtn = document.getElementById('btn-freeze');
                if (freezeBtn) freezeBtn.click();
                break;
        }
    }
    
    // Atajos sin Ctrl
    else {
        switch(e.key.toLowerCase()) {
            case 'f1':
                e.preventDefault();
                console.log('Ayuda');
                break;
                
            case 'f2':
                e.preventDefault();
                const settingsBtn = document.getElementById('btn-settings');
                if (settingsBtn) settingsBtn.click();
                break;
                
            case 'f5':
                e.preventDefault();
                console.log('Actualizar fuentes');
                break;
                
            case 'f11':
                e.preventDefault();
                toggleFullscreen();
                break;
                
            case 'escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                break;
        }
    }
}

function recallScene(index) {
    const scenes = document.querySelectorAll('.scene-item');
    if (index >= 0 && index < scenes.length) {
        const scene = scenes[index];
        const sceneBtn = scene.querySelector('.program-btn');
        if (sceneBtn) {
            sceneBtn.click();
        }
    }
}

function updateNetworkStatus() {
    const networkStatus = document.getElementById('networkStatus');
    const serverStatus = document.getElementById('serverStatus');
    
    if (navigator.onLine) {
        if (networkStatus) networkStatus.textContent = 'Online';
        if (serverStatus) serverStatus.textContent = 'Conectado';
        console.log('🌐 Conectado a internet');
    } else {
        if (networkStatus) networkStatus.textContent = 'Offline';
        if (serverStatus) serverStatus.textContent = 'Desconectado';
        console.warn('⚠️ Sin conexión a internet');
        showNotification('Conexión perdida', 'Verifica tu conexión a internet', 'error');
    }
}

function handleVisibilityChange() {
    if (document.hidden) {
        console.log('📱 Aplicación en segundo plano');
    } else {
        console.log('📱 Aplicación en primer plano');
        // Podríamos actualizar datos aquí
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error al entrar en pantalla completa: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function showNotification(title, message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
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
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
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
    
    container.appendChild(notification);
}

// Ocultar pantalla de carga cuando todo esté listo
window.addEventListener('load', function() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 2000);
});

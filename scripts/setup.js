#!/usr/bin/env node

/**
 * Script de configuración inicial para TeleMaster Pro
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('='.repeat(60));
console.log('🛠️  TeleMaster Pro - Setup Wizard');
console.log('='.repeat(60));

const questions = [
  {
    name: 'systemName',
    question: 'Nombre del sistema: ',
    default: 'TeleMaster Pro'
  },
  {
    name: 'port',
    question: 'Puerto del servidor (3000): ',
    default: '3000'
  },
  {
    name: 'videoResolution',
    question: 'Resolución de video por defecto (1920x1080): ',
    default: '1920x1080'
  },
  {
    name: 'videoFps',
    question: 'FPS de video por defecto (50): ',
    default: '50'
  },
  {
    name: 'recordingPath',
    question: 'Ruta para grabaciones (./recordings): ',
    default: './recordings'
  },
  {
    name: 'enableHLS',
    question: '¿Habilitar salida HLS local? (y/n): ',
    default: 'y'
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    createConfig();
    return;
  }

  const q = questions[index];
  
  rl.question(q.question, (answer) => {
    answers[q.name] = answer.trim() || q.default;
    askQuestion(index + 1);
  });
}

function createConfig() {
  console.log('\n📋 Creando configuración...');
  
  // Crear directorios necesarios
  const directories = [
    'recordings',
    'streams',
    'logs',
    'cache',
    'server/config'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Directorio creado: ${dir}`);
    }
  });
  
  // Crear archivo de configuración
  const config = {
    system: {
      name: answers.systemName,
      version: "1.0.0",
      autoStart: false,
      logLevel: "info"
    },
    video: {
      defaultResolution: answers.videoResolution,
      defaultFps: parseInt(answers.videoFps),
      defaultBitrate: "8000000",
      defaultCodec: "h264"
    },
    audio: {
      channels: 2,
      sampleRate: 48000,
      bitrate: "192000",
      codec: "aac"
    },
    streaming: {
      defaultProtocol: "rtmp",
      adaptiveBitrate: true,
      redundancy: false
    },
    recording: {
      defaultFormat: "mp4",
      defaultCodec: "h264",
      defaultPath: answers.recordingPath,
      autoSegment: false
    },
    hardware: {
      blackmagic: true,
      ndi: true,
      usb: true,
      ipCameras: true
    },
    ui: {
      theme: "dark",
      multiviewerLayout: "2x2",
      showStats: true
    }
  };
  
  // Agregar destino HLS si está habilitado
  if (answers.enableHLS.toLowerCase() === 'y') {
    config.destinations = [
      {
        name: "Local HLS",
        enabled: true,
        type: "hls",
        path: "./streams/live.m3u8",
        segmentDuration: 2,
        playlistLength: 6
      }
    ];
  }
  
  const configPath = path.join(__dirname, '..', 'server', 'config', 'defaults.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  
  console.log('✅ Configuración creada en:', configPath);
  console.log('\n🎉 Setup completado!');
  console.log('\nPara iniciar el sistema:');
  console.log('  npm start');
  console.log('\nPara desarrollo:');
  console.log('  npm run dev');
  
  rl.close();
}

// Iniciar el setup
askQuestion(0);

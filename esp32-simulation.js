// =========================================
// ESP32 SIMULATION SCRIPT
// Mensimulasikan data sensor dari ESP32 ke Server
// =========================================
process.env.TZ = 'Asia/Makassar';

const axios = require('axios');

// =========================================
// CONFIGURATION
// =========================================
const SERVER_URL = 'http://localhost:3003/api/sensor/data';
const SEND_INTERVAL = 5000; // Kirim data setiap 5 detik
const ERROR_PROBABILITY = 0.05; // 5% kemungkinan error sensor (setiap menit sekitar 1x)

// =========================================
// SENSOR DATA RANGES (REALISTIC VALUES)
// =========================================
const SENSOR_RANGES = {
    // Tegangan solar cell (12V system dengan fluctuasi charging)
    tegangan: {
        min: 11.5,      // Voltage drop saat beban tinggi
        max: 14.8,      // Voltage saat charging penuh
        normal: 12.5,   // Normal operating voltage
        error: 0        // Error value
    },
    
    // Arus (tergantung beban lampu LED)
    arus: {
        min: 0.2,       // Standby current
        max: 2.5,       // Maximum LED current
        lampOn: 1.8,    // Typical lamp current when ON
        lampOff: 0.3,   // Minimal current when OFF
        error: 0        // Error value
    },
    
    // Cahaya (lux) - BH1750 sensor
    cahaya: {
        siang: {
            min: 5000,
            max: 65000
        },
        sore: {
            min: 500,
            max: 5000
        },
        malam: {
            min: 0,
            max: 150
        },
        error: 0        // Error value
    }
};

// =========================================
// SIMULATION STATE
// =========================================
let simulationState = {
    timeOfDay: 'siang',     // siang, sore, malam
    relayStatus: false,
    errorMode: false,
    errorSensor: null,      // 'tegangan', 'arus', 'cahaya', atau null
    manualControl: false,
    dataCount: 0,
    lastErrorTime: Date.now()
};

// =========================================
// HELPER FUNCTIONS
// =========================================

/**
 * Generate random number dalam range
 */
function randomInRange(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
}

/**
 * Generate random integer dalam range
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simulate waktu dalam sehari (cycle 24 jam dipercepat)
 */
function updateTimeOfDay() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Real-time based simulation
    if (hour >= 6 && hour < 17) {
        // 06:00 - 17:00 = Siang
        simulationState.timeOfDay = 'siang';
    } else if (hour >= 17 && hour < 19) {
        // 17:00 - 19:00 = Sore (transisi)
        simulationState.timeOfDay = 'sore';
    } else {
        // 19:00 - 06:00 = Malam
        simulationState.timeOfDay = 'malam';
    }
}

/**
 * Generate realistic tegangan (voltage)
 */
function generateTegangan() {
    if (simulationState.errorMode && simulationState.errorSensor === 'tegangan') {
        return SENSOR_RANGES.tegangan.error;
    }
    
    const baseVoltage = SENSOR_RANGES.tegangan.normal;
    
    // Voltage naik saat charging (siang)
    if (simulationState.timeOfDay === 'siang') {
        return randomInRange(baseVoltage, SENSOR_RANGES.tegangan.max);
    }
    
    // Voltage turun saat discharge (malam dengan relay ON)
    if (simulationState.timeOfDay === 'malam' && simulationState.relayStatus) {
        return randomInRange(SENSOR_RANGES.tegangan.min, baseVoltage);
    }
    
    // Normal voltage
    return randomInRange(baseVoltage - 0.5, baseVoltage + 0.5);
}

/**
 * Generate realistic arus (current)
 */
function generateArus() {
    if (simulationState.errorMode && simulationState.errorSensor === 'arus') {
        return SENSOR_RANGES.arus.error;
    }
    
    // Arus tinggi saat relay ON (lampu menyala)
    if (simulationState.relayStatus) {
        return randomInRange(
            SENSOR_RANGES.arus.lampOn - 0.3,
            SENSOR_RANGES.arus.lampOn + 0.3
        );
    }
    
    // Arus minimal saat relay OFF
    return randomInRange(
        SENSOR_RANGES.arus.lampOff - 0.1,
        SENSOR_RANGES.arus.lampOff + 0.1
    );
}

/**
 * Generate realistic cahaya (light intensity)
 */
function generateCahaya() {
    if (simulationState.errorMode && simulationState.errorSensor === 'cahaya') {
        return SENSOR_RANGES.cahaya.error;
    }
    
    let range;
    
    switch (simulationState.timeOfDay) {
        case 'siang':
            range = SENSOR_RANGES.cahaya.siang;
            break;
        case 'sore':
            range = SENSOR_RANGES.cahaya.sore;
            break;
        case 'malam':
            range = SENSOR_RANGES.cahaya.malam;
            break;
        default:
            range = SENSOR_RANGES.cahaya.siang;
    }
    
    return randomInRange(range.min, range.max, 0);
}

/**
 * Generate gerak (PIR motion detection)
 * Probabilitas deteksi gerak lebih tinggi di malam hari
 */
function generateGerak() {
    if (simulationState.timeOfDay === 'malam') {
        // 30% chance of motion detection at night
        return Math.random() < 0.3;
    } else if (simulationState.timeOfDay === 'sore') {
        // 20% chance of motion detection at evening
        return Math.random() < 0.2;
    } else {
        // 10% chance of motion detection at day
        return Math.random() < 0.1;
    }
}

/**
 * Simulate sensor error (setiap menit ada kemungkinan error)
 */
function checkSensorError() {
    const timeSinceLastError = Date.now() - simulationState.lastErrorTime;
    
    // Check error setiap 1 menit (60000 ms)
    if (timeSinceLastError > 60000) {
        if (Math.random() < ERROR_PROBABILITY) {
            // Trigger error mode
            simulationState.errorMode = true;
            
            // Random error sensor
            const sensors = ['tegangan', 'arus', 'cahaya'];
            simulationState.errorSensor = sensors[randomInt(0, 2)];
            
            console.log(`\n⚠️  SENSOR ERROR TRIGGERED: ${simulationState.errorSensor.toUpperCase()}\n`);
            
            // Error duration: 15-30 detik
            const errorDuration = randomInt(15000, 30000);
            
            setTimeout(() => {
                simulationState.errorMode = false;
                simulationState.errorSensor = null;
                console.log(`\n✅ SENSOR ERROR RESOLVED\n`);
            }, errorDuration);
        }
        
        simulationState.lastErrorTime = Date.now();
    }
}

/**
 * Update relay status berdasarkan logika AUTO
 */
function updateRelayStatus(cahaya, gerak) {
    // Jika mode manual, relay status tidak berubah otomatis
    if (simulationState.manualControl) {
        return simulationState.relayStatus;
    }
    
    // Mode AUTO: Logika relay
    if (cahaya >= 200) {
        // SIANG - Lampu mati
        return false;
    } else {
        // MALAM - Cek PIR
        if (gerak) {
            return true;  // Ada gerak, lampu nyala
        } else {
            return false; // Tidak ada gerak, lampu mati
        }
    }
}

/**
 * Generate complete sensor data
 */
function generateSensorData() {
    updateTimeOfDay();
    checkSensorError();
    
    const tegangan = generateTegangan();
    const arus = generateArus();
    const cahaya = generateCahaya();
    const gerak = generateGerak();
    
    // Update relay status (AUTO mode)
    if (!simulationState.manualControl) {
        simulationState.relayStatus = updateRelayStatus(cahaya, gerak);
    }
    
    const data = {
        tegangan: tegangan,
        arus: arus,
        cahaya: cahaya,
        gerak: gerak,
        relay_status: simulationState.relayStatus
    };
    
    return data;
}

/**
 * Send data ke server
 */
async function sendDataToServer(data) {
    try {
        const response = await axios.post(SERVER_URL, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            // Update relay status dari server response (untuk mode MANUAL)
            if (response.data.relay_command) {
                const newRelayStatus = response.data.relay_command === 'ON';
                
                if (newRelayStatus !== simulationState.relayStatus) {
                    simulationState.relayStatus = newRelayStatus;
                    console.log(`🔦 Relay command from server: ${response.data.relay_command}`);
                }
            }
            
            // Update mode dari server
            if (response.data.mode) {
                simulationState.manualControl = response.data.mode === 'manual';
            }
            
            // ✅ HANDLE BUZZER TRIGGER
            if (response.data.buzzer === true) {
                const duration = response.data.buzzer_duration || 10000;
                triggerBuzzer(duration, response.data.error_details);
            }
            
            return true;
        } else {
            console.error('❌ Server response error:', response.data.message);
            return false;
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Connection refused - Server might be down');
        } else {
            console.error('❌ Send data error:', error.message);
        }
        return false;
    }
}

/**
 * ✅ TRIGGER BUZZER (SIMULASI)
 */
function triggerBuzzer(duration, errorDetails) {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🚨 BUZZER TRIGGERED - SENSOR ERROR DETECTED                  ║
╠═══════════════════════════════════════════════════════════════╣
║  Duration    : ${(duration / 1000).toString().padStart(2)} seconds${' '.repeat(40)}║
║  Error Details:                                               ║
`);
    
    if (errorDetails) {
        if (errorDetails.tegangan) {
            console.log(`║  - Tegangan  : ${errorDetails.tegangan.padEnd(44)}║`);
        }
        if (errorDetails.arus) {
            console.log(`║  - Arus      : ${errorDetails.arus.padEnd(44)}║`);
        }
        if (errorDetails.cahaya) {
            console.log(`║  - Cahaya    : ${errorDetails.cahaya.padEnd(44)}║`);
        }
    }
    
    console.log(`╚═══════════════════════════════════════════════════════════════╝
    `);
    
    // Simulasi buzzer ON
    console.log('🔊 BUZZER: ON');
    
    // Set timeout untuk buzzer OFF
    setTimeout(() => {
        console.log('🔇 BUZZER: OFF\n');
    }, duration);
}

/**
 * Display sensor data
 */
function displaySensorData(data) {
    simulationState.dataCount++;
    
    const timeOfDayEmoji = {
        'siang': '☀️',
        'sore': '🌅',
        'malam': '🌙'
    };
    
    const relayEmoji = data.relay_status ? '💡 ON' : '⚫ OFF';
    const gerakEmoji = data.gerak ? '🚶 DETECTED' : '🚫 NO MOTION';
    const errorEmoji = simulationState.errorMode ? '⚠️ ERROR' : '✅ OK';
    
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  ESP32 SIMULATION #${simulationState.dataCount.toString().padStart(4, '0')}                                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Time: ${timeOfDayEmoji[simulationState.timeOfDay]} ${simulationState.timeOfDay.toUpperCase().padEnd(15)} Mode: ${simulationState.manualControl ? 'MANUAL' : 'AUTO  '}          ║
║  Status: ${errorEmoji} ${simulationState.errorMode ? `(${simulationState.errorSensor})`.padEnd(35) : ''.padEnd(42)}║
╠═══════════════════════════════════════════════════════════════╣
║  ⚡ Tegangan    : ${data.tegangan.toFixed(2).padStart(7)} V                              ║
║  🔌 Arus        : ${data.arus.toFixed(2).padStart(7)} A                              ║
║  💡 Cahaya      : ${data.cahaya.toFixed(0).padStart(7)} Lux                           ║
║  🚶 Gerak       : ${gerakEmoji.padEnd(42)}║
║  🔦 Relay       : ${relayEmoji.padEnd(42)}║
╚═══════════════════════════════════════════════════════════════╝
    `);
}

// =========================================
// MAIN SIMULATION LOOP
// =========================================
async function runSimulation() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           🚀 ESP32 SIMULATION STARTED                         ║
║                                                               ║
║  Server URL    : ${SERVER_URL.padEnd(42)}║
║  Send Interval : ${(SEND_INTERVAL / 1000).toString().padStart(2)} seconds${' '.repeat(36)}║
║  Error Prob.   : ${(ERROR_PROBABILITY * 100).toFixed(0)}%${' '.repeat(44)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
    
    // Kirim data pertama kali
    const initialData = generateSensorData();
    displaySensorData(initialData);
    await sendDataToServer(initialData);
    
    // Loop kirim data setiap interval
    setInterval(async () => {
        const sensorData = generateSensorData();
        displaySensorData(sensorData);
        await sendDataToServer(sensorData);
    }, SEND_INTERVAL);
}

// =========================================
// KEYBOARD CONTROL (OPTIONAL)
// =========================================
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  KEYBOARD CONTROLS:                                           ║
║  ─────────────────────────────────────────────────────────────║
║  [M] Toggle Manual/Auto Mode                                  ║
║  [R] Toggle Relay ON/OFF (Manual mode only)                   ║
║  [E] Trigger Sensor Error                                     ║
║  [D] Toggle Siang/Sore/Malam                                  ║
║  [Q] Quit                                                     ║
╚═══════════════════════════════════════════════════════════════╝
`);

process.stdin.on('keypress', (str, key) => {
    if (key.name === 'q') {
        console.log('\n👋 Simulation stopped.\n');
        process.exit();
    }
    
    if (key.name === 'm') {
        simulationState.manualControl = !simulationState.manualControl;
        console.log(`\n🎮 Mode changed to: ${simulationState.manualControl ? 'MANUAL' : 'AUTO'}\n`);
    }
    
    if (key.name === 'r' && simulationState.manualControl) {
        simulationState.relayStatus = !simulationState.relayStatus;
        console.log(`\n🔦 Relay manually set to: ${simulationState.relayStatus ? 'ON' : 'OFF'}\n`);
    }
    
    if (key.name === 'e') {
        simulationState.errorMode = true;
        const sensors = ['tegangan', 'arus', 'cahaya'];
        simulationState.errorSensor = sensors[randomInt(0, 2)];
        console.log(`\n⚠️  Manual sensor error triggered: ${simulationState.errorSensor.toUpperCase()}\n`);
        
        setTimeout(() => {
            simulationState.errorMode = false;
            simulationState.errorSensor = null;
            console.log(`\n✅ Sensor error resolved\n`);
        }, 20000);
    }
    
    if (key.name === 'd') {
        const times = ['siang', 'sore', 'malam'];
        const currentIndex = times.indexOf(simulationState.timeOfDay);
        const nextIndex = (currentIndex + 1) % times.length;
        simulationState.timeOfDay = times[nextIndex];
        console.log(`\n🌤️  Time changed to: ${simulationState.timeOfDay.toUpperCase()}\n`);
    }
});

// =========================================
// START SIMULATION
// =========================================
runSimulation();

// UUIDs for the BLE service and characteristics
const serviceUuid = 'e2cfbe98-68fe-33cf-da9a-0464bc340004';
const onOffCharUuid = 'd1bfad87-57ed-22de-c989-0353ab210003';
const rgbCharUuid = 'f3dfcfa9-79ef-44bf-ebab-0575cd450005';

let device = null;
let server = null;
let onOffCharacteristic = null;
let rgbCharacteristic = null;

const state = {
    isConnected: false,
    isOn: false,
    r: 255,
    g: 100,
    b: 30
};

const connectBtn = document.getElementById('connectBtn');
const toggleBtn = document.getElementById('toggleBtn');
const applyColorBtn = document.getElementById('applyColorBtn');
const colorPreview = document.getElementById('colorPreview');

// Create and draw the color wheel
const colorWheelCanvas = document.getElementById('colorWheel');
const ctx = colorWheelCanvas.getContext('2d');

// Draw color wheel on load
drawColorWheel(ctx);

// Function to draw a color wheel
function drawColorWheel(context) {
    const radius = context.canvas.width / 2;
    const toRad = Math.PI / 180;
    const image = context.createImageData(context.canvas.width, context.canvas.height);

    for (let y = 0; y < context.canvas.height; y++) {
        for (let x = 0; x < context.canvas.width; x++) {
            const dx = x - radius;
            const dy = y - radius;
            const d = Math.sqrt(dx*dx + dy*dy);

            if (d <= radius) {
                // Angle and distance from center
                const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 180;
                const sat = d / radius;
                const [r, g, b] = hsvToRgb(angle, sat, 1);
                const index = (y * context.canvas.width + x) * 4;
                image.data[index] = r;
                image.data[index+1] = g;
                image.data[index+2] = b;
                image.data[index+3] = 255;
            }
        }
    }
    context.putImageData(image, 0, 0);
}

// Convert HSV to RGB (for the color wheel)
function hsvToRgb(h, s, v) {
    let f, p, q, t;
    let i = Math.floor(h / 60) % 6;
    f = h / 60 - i;
    p = Math.round(v * (1 - s) * 255);
    q = Math.round(v * (1 - f * s) * 255);
    t = Math.round(v * (1 - (1 - f) * s) * 255);
    v = Math.round(v * 255);

    switch(i) {
        case 0: return [v, t, p];
        case 1: return [q, v, p];
        case 2: return [p, v, t];
        case 3: return [p, q, v];
        case 4: return [t, p, v];
        case 5: return [v, p, q];
    }
}

// Update the color preview box
function updateColorPreview(r, g, b) {
    colorPreview.style.backgroundColor = `rgb(${r},${g},${b})`;
}

// Write to On/Off characteristic
async function writeOnOff(value) {
    if (onOffCharacteristic) {
        const data = `${value ? 1 : 0}`;
        const encoder = new TextEncoder();
        await onOffCharacteristic.writeValue(encoder.encode(data));
    }
}

// Write to RGB characteristic
async function writeColor(r, g, b) {
    if (rgbCharacteristic) {
        const colorString = `${r},${g},${b}`;
        const encoder = new TextEncoder();
        await rgbCharacteristic.writeValue(encoder.encode(colorString));
    }
}

// Connect to BLE device
async function connectDevice() {
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'LedsPhilipp' }],
            optionalServices: [serviceUuid]
        });
        server = await device.gatt.connect();
        const service = await server.getPrimaryService(serviceUuid);
        onOffCharacteristic = await service.getCharacteristic(onOffCharUuid);
        rgbCharacteristic = await service.getCharacteristic(rgbCharUuid);

        state.isConnected = true;
        toggleBtn.disabled = false;
        applyColorBtn.disabled = false;
        connectBtn.textContent = 'Connected';
    } catch (error) {
        console.error('Failed to connect:', error);
    }
}

// Event Handlers
connectBtn.addEventListener('click', async () => {
    if (!state.isConnected) {
        await connectDevice();
    }
});

toggleBtn.addEventListener('click', async () => {
    state.isOn = !state.isOn;
    await writeOnOff(state.isOn);
    toggleBtn.textContent = state.isOn ? 'Turn Off' : 'Turn On';
    if (state.isOn) {
        await writeColor(state.r, state.g, state.b);
    }
});

// Handle color selection from the color wheel
colorWheelCanvas.addEventListener('click', (e) => {
    const rect = colorWheelCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixelData = ctx.getImageData(x, y, 1, 1).data;

    if (pixelData[3] !== 0) { // inside the wheel
        state.r = pixelData[0];
        state.g = pixelData[1];
        state.b = pixelData[2];
        updateColorPreview(state.r, state.g, state.b);
    }
});

applyColorBtn.addEventListener('click', async () => {
    await writeColor(state.r, state.g, state.b);
});

// Initialize UI
updateColorPreview(state.r, state.g, state.b);

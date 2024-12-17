// Functional approach: 
// - Separate data handling, BLE ops, and UI updates into distinct functions.
// - Data oriented: keep track of state in a simple object, update device via pure functions.

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
const rSlider = document.getElementById('rSlider');
const gSlider = document.getElementById('gSlider');
const bSlider = document.getElementById('bSlider');
const colorPreview = document.getElementById('colorPreview');

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

[ rSlider, gSlider, bSlider ].forEach(slider => {
    slider.addEventListener('input', () => {
        const r = parseInt(rSlider.value, 10);
        const g = parseInt(gSlider.value, 10);
        const b = parseInt(bSlider.value, 10);
        updateColorPreview(r, g, b);
    });
});

applyColorBtn.addEventListener('click', async () => {
    state.r = parseInt(rSlider.value, 10);
    state.g = parseInt(gSlider.value, 10);
    state.b = parseInt(bSlider.value, 10);
    await writeColor(state.r, state.g, state.b);
});

// Initialize UI
updateColorPreview(state.r, state.g, state.b);

Qt.include("mapUtils.js");
Qt.include("entityUtils.js");

/* ----------------------------- MAP SETUP ----------------------------- */
const map = L.map('map').setView([-37.814, 144.963], 13); // Melbourne
let currentBaseLayer;
let markersLayer = L.layerGroup().addTo(map);
let linesLayer = L.layerGroup().addTo(map);
let entitiesLayer = L.layerGroup().addTo(map);



updateTileLayer('osm'); // Default map layer



// Player marker setup
const playerLatLng = [-37.814, 144.963];
const playerMarker = createDiamondMarker(playerLatLng, 'white').addTo(map);
L.circle(playerLatLng, { color: 'white', radius: 1000, fillOpacity: 0.05 }).addTo(map);

// Entity markers setup
const entityPositions = [
    [-37.814, 144.961],
    [-37.814, 144.962],
    [-37.813, 144.963],
    [-37.815, 144.963],
    [-37.816, 144.962]
];

const entities = entityPositions.map((pos, index) => {
    const color = `hsl(${index * 72}, 100%, 50%)`;
    const marker = createDiamondMarker(pos, color).addTo(map);
    const circle = L.circle(pos, { color, radius: 2000, fillOpacity: 0.05 }).addTo(map);

    return {
        marker,
        circle,
        latLng: L.latLng(pos),
        direction: Math.random() * 2 * Math.PI,
        speed: 0.00005,
        stopDuration: Math.random() * 2000 + 2000,
        timeStopped: 0
    };
});



// Start animating entities
animateEntities();

// Initialize WebChannel
function initWebChannel(channel) {
    entityManager = channel.objects.entityManager;
    testSuite();
}

window.onload = () => new QWebChannel(qt.webChannelTransport, initWebChannel);

// Helper functions
const ANIMATION_RADIUS = 0.001;
const ANIMATION_SPEED = 0.01;
const PATTERN_PERIOD = 5000;









/* ----------------------------- VARIABLES ----------------------------- */
const points = [];
let lines = [];
let mode = 'scroll';            // Default map mode
let autoCentreOnPlane = true;
let firstPoint = null;

/* ------------------------- INTERNAL FUNCTIONS ------------------------- */


/* ----------------------------- MAIN LOOP ----------------------------- */
map.on('click', function(event) {
    const coords = event.latlng;
    if (!coords) return;

    if (mode === 'add-point') {
        const pointCoords = {
            lat: coords.lat,
            lon: coords.lng
        };
        points.push(pointCoords);
        drawPoints();
    }
    else if (mode === 'draw-line') {
        if (firstPoint === null) {
            firstPoint = { lat: coords.lat, lon: coords.lng };
        }
        else {
            const secondPoint = { lat: coords.lat, lon: coords.lng };
            lines.push({ start: firstPoint, end: secondPoint });
            drawLines();
            firstPoint = null; // Reset for the next line
        }
    }
    else if (mode === 'remove-point') {
        removePoint(coords);
    }
});

/* -------------------------- EVENT LISTENERS -------------------------- */
document.getElementById('add-point').addEventListener('click', function() {
    mode = 'add-point';
    this.classList.add('active');
    document.getElementById('draw-line').classList.remove('active');
    document.getElementById('remove-point').classList.remove('active');
    document.getElementById('scroll').classList.remove('active');
    firstPoint = null; // Reset line drawing mode
});

document.getElementById('scroll').addEventListener('click', function() {
    mode = 'scroll';
    this.classList.add('active');
    document.getElementById('add-point').classList.remove('active');
    document.getElementById('remove-point').classList.remove('active');
    document.getElementById('draw-line').classList.remove('active');
    firstPoint = null; // Reset line drawing mode
});

document.getElementById('draw-line').addEventListener('click', function() {
    mode = 'draw-line';
    this.classList.add('active');
    document.getElementById('add-point').classList.remove('active');
    document.getElementById('remove-point').classList.remove('active');
    document.getElementById('scroll').classList.remove('active');
    firstPoint = null; // Reset line drawing mode
});

document.getElementById('remove-point').addEventListener('click', function() {
    mode = 'remove-point';
    this.classList.add('active');
    document.getElementById('add-point').classList.remove('active');
    document.getElementById('draw-line').classList.remove('active');
    document.getElementById('scroll').classList.remove('active');
    firstPoint = null; // Reset line drawing mode
});

document.getElementById('map-mode').addEventListener('change', function() {
    updateTileLayer(this.value);
});

document.getElementById('toggle-centre').addEventListener('click', function() {
    autoCentreOnPlane = !autoCentreOnPlane;
    this.classList.toggle('active', autoCentreOnPlane);
});

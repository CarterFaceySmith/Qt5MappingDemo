// map.js
let entityManager;
let networkWrapper;

async function initWebChannel() {
    return new Promise((resolve, reject) => {
        new QWebChannel(qt.webChannelTransport, channel => {
            entityManager = channel.objects.entityManager;
            networkWrapper = channel.objects.networkWrapper;
            if (entityManager && networkWrapper) {
                resolve();
            } else {
                reject(new Error('Failed to initialise entityManager and networkWrapper'));
            }
        });
    });
}
initWebChannel();

// Initialise the map centered on Melbourne, Australia
const map = L.map('map').setView([-37.8136, 144.9631], 10);

// Custom dark style for the map
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Custom icon for entities
// FIXME: Decide on icon pngs and add to codebase
const entityIcon = L.icon({
    // iconUrl: 'qrc:///images/entity_icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

// Custom icon for emitters
const emitterIcon = L.icon({
    // iconUrl: 'qrc:///images/emitter_icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

// Object to store all markers
const markers = {};

// Function to add or update an entity on the map
function updateEntity(entity) {
    const position = [entity.latitude, entity.longitude];
    if (markers[entity.UID]) {
        markers[entity.UID].setLatLng(position);
    } else {
        markers[entity.UID] = L.marker(position, {icon: entityIcon})
            .addTo(map)
            .bindPopup(`
                <b>${entity.name}</b><br>
                UID: ${entity.UID}<br>
                Latitude: ${entity.latitude.toFixed(4)}<br>
                Longitude: ${entity.longitude.toFixed(4)}<br>
                Altitude: ${entity.altitude} m
            `);
    }
}

// Function to add or update an emitter on the map
function updateEmitter(emitter) {
    const position = [emitter.lat, emitter.lon];
    if (markers[emitter.id]) {
        markers[emitter.id].setLatLng(position);
    } else {
        markers[emitter.id] = L.marker(position, {icon: emitterIcon})
            .addTo(map)
            .bindPopup(`
                <b>${emitter.type}</b><br>
                ID: ${emitter.id}<br>
                Latitude: ${emitter.lat.toFixed(4)}<br>
                Longitude: ${emitter.lon.toFixed(4)}<br>
                Frequency: ${emitter.freqMin.toFixed(2)} - ${emitter.freqMax.toFixed(2)} MHz
            `);
    }
}

// Function to remove an entity or emitter from the map
function removeMarker(id) {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
}

// Function to update the map with current entities and emitters
function updateMap() {
    // Get entities from EntityManager
    // const entities = entityManager.getEntityList();
    // entities.forEach(updateEntity);

    // // Receive emitters from NetworkInterfaceWrapper
    // const emitter = networkWrapper.receiveEmitter();
    // if (emitter) {
    //     updateEmitter(emitter);
    // }
    entityManager.qmlLog("Hello Boss")
}

// Update the map every 5 seconds
setInterval(updateMap, 5000);

// Add radar-like sweep effect
const radarSweep = L.circle([-37.8136, 144.9631], {
    radius: 100000,
    color: '#00ff00',
    fillColor: '#00ff00',
    fillOpacity: 0.1,
    weight: 2
}).addTo(map);

let angle = 0;
function animateRadar() {
    angle = (angle + 2) % 360;
    const x = 100000 * Math.cos(angle * Math.PI / 180);
    const y = 100000 * Math.sin(angle * Math.PI / 180);
    radarSweep.setLatLng(map.layerPointToLatLng(
        map.latLngToLayerPoint([-37.8136, 144.9631]).add(L.point(x, y))
    ));
    requestAnimationFrame(animateRadar);
}
animateRadar();

// Add some UI elements
const hud = document.createElement('div');
hud.className = 'hud';
hud.innerHTML = `
    <div class="crosshair">+</div>
    <div class="altitude">ALT: 10000 FT</div>
    <div class="speed">SPD: 500 KTS</div>
    <div class="heading">HDG: 090°</div>
`;
document.body.appendChild(hud);

// Style for the HUD
// Style for the HUD
const style = document.createElement('style');
style.textContent = `
    .hud {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none; /* Ensures the HUD doesn't block interactions with the map */
        font-family: monospace;
        color: #00ff00;
        text-shadow: 0 0 5px #00ff00;
        z-index: 10000; /* Set a high z-index to ensure it stays above the map */
    }
    .crosshair {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 40px;
    }
    .altitude {
        position: absolute;
        bottom: 20px;
        left: 20px;
    }
    .speed {
        position: absolute;
        bottom: 20px;
        right: 20px;
    }
    .heading {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
    }
`;
document.head.appendChild(style);


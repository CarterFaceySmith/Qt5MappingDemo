// Initialize the map
const map = L.map('map').setView([51.505, -0.09], 13);

// Add tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to create a diamond marker
function createDiamondMarker(latLng, color) {
    return L.marker(latLng, {
        icon: L.divIcon({
            className: 'diamond-icon',
            html: `<div style="background-color: ${color}; width: 20px; height: 20px; transform: rotate(45deg);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [12, 12]
        })
    });
}

// Player marker setup
const playerLatLng = [51.505, -0.09];
const playerMarker = createDiamondMarker(playerLatLng, 'white').addTo(map);
L.circle(playerLatLng, { color: 'white', radius: 1000, fillOpacity: 0.05 }).addTo(map);

// Entity markers setup
const entityPositions = [
    [51.515, -0.1],
    [51.515, -0.12],
    [51.525, -0.1],
    [51.525, -0.12],
    [51.535, -0.1]
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

// Function to animate entities
function animateEntities() {
    function move(timestamp) {
        entities.forEach(entity => {
            const { marker, circle } = entity;
            entity.timeStopped += timestamp - (entity.lastTimestamp || timestamp);
            entity.lastTimestamp = timestamp;

            if (entity.timeStopped < entity.stopDuration) {
                const latLng = marker.getLatLng();
                const newLatLng = [
                    latLng.lat + Math.sin(entity.direction) * entity.speed,
                    latLng.lng + Math.cos(entity.direction) * entity.speed
                ];

                marker.setLatLng(newLatLng);
                circle.setLatLng(newLatLng);

                if (Math.random() < 0.01) entity.direction = Math.random() * 2 * Math.PI;
                if (Math.random() < 0.01) {
                    entity.stopDuration = Math.random() * 2000 + 2000;
                    entity.timeStopped = 0;
                } else if (Math.random() < 0.01) {
                    entity.direction += Math.PI;
                }
            } else {
                entity.speed = 0;
                if (Math.random() < 0.01) {
                    entity.speed = 0.00005;
                    entity.stopDuration = Math.random() * 2000 + 2000;
                    entity.timeStopped = 0;
                }
            }
        });

        requestAnimationFrame(move);
    }

    move(0);
}

// Start animating entities
animateEntities();

// Icon definitions
const icons = {
    user: L.divIcon({
        className: 'user-position-icon',
        html: '<i class="material-icons">flight</i>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    }),
    plane: L.divIcon({
        className: 'user-position-icon',
        html: '<i class="material-icons">flight</i>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        draggable: false
    }),
    star: L.divIcon({
        className: 'additional-icon',
        html: '<i class="material-icons">star</i>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        draggable: true
    }),
    heart: L.divIcon({
        className: 'additional-icon',
        html: '<i class="material-icons">favorite</i>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    }),
    check: L.divIcon({
        className: 'additional-icon',
        html: '<i class="material-icons">check</i>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    }),
    alert: L.divIcon({
        className: 'additional-icon',
        html: '<i class="material-icons">warning</i>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    })
};

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

function updateEntityLayer(UID, latLng, radius, color) {
    if (!entityLayers[UID]) return;

    markersLayer.removeLayer(entityLayers[UID].marker);
    markersLayer.removeLayer(entityLayers[UID].circle);

    const marker = L.marker(latLng, { icon: icons.alert });
    const circle = L.circle(latLng, { color, fillColor: color, fillOpacity: 0.2, radius });

    marker.addTo(markersLayer);
    circle.addTo(markersLayer);

    entityLayers[UID] = { marker, circle };
}

function createEntity() {
    if (!entityManager) return;

    const name = document.getElementById("name").value.trim();
    const UID = document.getElementById("UID").value.trim();
    const radius = parseFloat(document.getElementById("radius").value.trim());
    const latitude = parseFloat(document.getElementById("latitude").value.trim());
    const longitude = parseFloat(document.getElementById("longitude").value.trim());

    const newEntity = entityManager.createEntity(name, UID, radius, latitude, longitude);
    if (newEntity) {
        entityManager.qmlLog(`JS: Created entity with name: ${name}`);
        updateEntityLayer(UID, L.latLng(latitude, longitude), radius, 'orange');
    } else {
        entityManager.qmlLog("JS: Failed to create an entity.");
    }
}

function getEntityByUID() {
    if (!entityManager) return;

    const UID = document.getElementById("UID").value.trim();
    const entity = entityManager.getEntityByUID(UID);
    entityManager.qmlLog(entity.UID ? `JS: Entity found with UID: ${UID}` : `JS: Entity not found with UID: ${UID}`);
}

function updateEntityId() {
    if (entityManager) {
        const currentId = document.getElementById("UID").value.trim();
        const newId = document.getElementById("newId").value.trim();
        entityManager.setEntityUID(currentId, newId);
    }
}

function logMessage() {
    if (entityManager) {
        const message = document.getElementById("logMessage").value.trim();
        entityManager.qmlLog(message);
    }
}

// Test Suite
function testSuite() {
    if (!entityManager) return;

    const testResults = {
        createdEntity: false,
        retrievedLat: false,
        retrievedLng: false,
        retrievedList: false,
        updatedLat: false,
        updatedLng: false
    };

    const testEnt = entityManager.createEntity("Test Entity", "TEST", 1000.0, -37.864, 144.963);

    if (testEnt) {
        entityManager.qmlLog("JS: Successfully created test entity with UID TEST.");
        testResults.createdEntity = true;

        markersLayer = L.layerGroup().addTo(map);

        const latPromise = new Promise((resolve, reject) => {
            entityManager.getEntityLatRadByUID("TEST", resultLat => resultLat !== undefined ? resolve(resultLat) : reject("Failed to retrieve latitude"));
        });

        const lngPromise = new Promise((resolve, reject) => {
            entityManager.getEntityLongRadByUID("TEST", resultLng => resultLng !== undefined ? resolve(resultLng) : reject("Failed to retrieve longitude"));
        });

        const listPromise = new Promise((resolve, reject) => {
            entityManager.getEntityList(resultList => Array.isArray(resultList) ? resolve(resultList) : reject("Failed to retrieve list or list is not an array"));
        });

        Promise.all([latPromise, lngPromise, listPromise]).then(([lat, lng, entityList]) => {
            entityManager.qmlLog(`JS: Test entity logged latitude of ${lat}`);
            entityManager.qmlLog(`JS: Test entity logged longitude of ${lng}`);
            entityManager.qmlLog(`JS: Received entity list with ${entityList.length} items`);

            const updateLat = lat + 0.01;
            const updateLng = lng + 0.01;

            entityManager.setEntityLatRadByUID("TEST", updateLat);
            entityManager.setEntityLongRadByUID("TEST", updateLng);

            entityManager.getEntityLatRadByUID("TEST", resultLat => {
                testResults.updatedLat = resultLat === updateLat;
                entityManager.qmlLog(testResults.updatedLat ? "JS: Latitude update successful." : "JS: Latitude update failed.");
            });

            entityManager.getEntityLongRadByUID("TEST", resultLng => {
                testResults.updatedLng = resultLng === updateLng;
                entityManager.qmlLog(testResults.updatedLng ? "JS: Longitude update successful." : "JS: Longitude update failed.");
            });
        }).catch(error => {
            entityManager.qmlLog(`JS: ${error}`);
        });
    }
}

document.getElementById("createEntityBtn").addEventListener("click", createEntity);
document.getElementById("getEntityBtn").addEventListener("click", getEntityByUID);
document.getElementById("updateEntityBtn").addEventListener("click", updateEntityId);
document.getElementById("logMessageBtn").addEventListener("click", logMessage);

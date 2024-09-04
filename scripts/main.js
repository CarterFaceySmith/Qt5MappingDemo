const map = L.map('map').setView([-37.814, 144.963], 13); // Melbourne
let currentBaseLayer;
let markersLayer = L.layerGroup().addTo(map);
let linesLayer = L.layerGroup().addTo(map);
let entitiesLayer = L.layerGroup().addTo(map);

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

function updateTileLayer(layerType) {
    if (currentBaseLayer) {
        map.removeLayer(currentBaseLayer);
    }

    const tileLayers = {
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'stamen-terrain': 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png?api_key=5a677b5d-7b56-450a-b358-2d5a5a8af829',
        'carto-light': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    };

    currentBaseLayer = L.tileLayer(tileLayers[layerType], {
    attribution: layerType === 'osm'
                 ? '© OpenStreetMap contributors'
                 : '© OpenStreetMap contributors, © Stamen Design, © CartoDB'
    }).addTo(map);
}

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

function logMessage() {
    if (entityManager) {
        const message = document.getElementById("logMessage").value.trim();
        entityManager.qmlLog(message);
    }
}

function printAllEntities() {
    if (entityManager) {
        entityManager.printAllEntities();
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

        const latPromise = new Promise((resolve, reject) => {
            entityManager.getEntityLatRadByUID("TEST", resultLat => {
                resultLat !== undefined ? resolve(resultLat) : reject("Failed to retrieve latitude");
            });
        });

        const lngPromise = new Promise((resolve, reject) => {
            entityManager.getEntityLongRadByUID("TEST", resultLng => {
                resultLng !== undefined ? resolve(resultLng) : reject("Failed to retrieve longitude");
            });
        });

        const listPromise = new Promise((resolve, reject) => {
            entityManager.getEntityList(resultList => {
                Array.isArray(resultList) ? resolve(resultList) : reject("Failed to retrieve list or list is not an array");
            });
        });

        Promise.all([latPromise, lngPromise, listPromise])
            .then(([lat, lng, entityList]) => {
                entityManager.qmlLog(`JS: Test entity logged latitude of ${lat}`);
                entityManager.qmlLog(`JS: Test entity logged longitude of ${lng}`);
                entityManager.qmlLog(`JS: Received entity list with ${entityList.length} items`);

                const updateLat = lat + 0.01;
                const updateLng = lng + 0.01;

                // Assuming these methods are asynchronous; handle them appropriately
                return Promise.all([
                    new Promise(resolve => entityManager.setEntityLatRadByUID("TEST", updateLat, resolve)),
                    new Promise(resolve => entityManager.setEntityLongRadByUID("TEST", updateLng, resolve))
                ]).then(() => Promise.all([
                    new Promise((resolve, reject) => {
                        entityManager.getEntityLatRadByUID("TEST", resultLat => {
                            if (resultLat === updateLat) {
                                testResults.updatedLat = true;
                                resolve();
                            } else {
                                reject("Latitude update failed.");
                            }
                        });
                    }),
                    new Promise((resolve, reject) => {
                        entityManager.getEntityLongRadByUID("TEST", resultLng => {
                            if (resultLng === updateLng) {
                                testResults.updatedLng = true;
                                resolve();
                            } else {
                                reject("Longitude update failed.");
                            }
                        });
                    })
                ]));
            })
            .then(() => {
                entityManager.qmlLog("JS: Latitude and longitude updates verified successfully.");
            })
            .catch(error => {
                entityManager.qmlLog(`JS: ${error}`);
            })
            .finally(() => {
                // Print list
                entityManager.printAllEntities();

                // Print the summary of tests
                let passCount = Object.values(testResults).filter(v => v === true).length;
                let totalTests = Object.keys(testResults).length;
                let summary = `Test Summary: ${passCount}/${totalTests} tests passed.`;

                entityManager.qmlLog("JS: " + summary);
                console.log(summary); // Log to console as well in case
            });
    }
}

function redrawAllLayers() {
    drawPoints();
    drawLines();
}

function drawPoints() {
    markersLayer.clearLayers();
    points.forEach((point) => {
        L.marker([point.lat, point.lon], { draggable: true })
        .addTo(markersLayer);
    });
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function drawLines() {
    linesLayer.clearLayers();
    lines.forEach(line => {
        if (line.start && line.end) {
            const lat1 = line.start.lat;
            const lon1 = line.start.lon;
            const lat2 = line.end.lat;
            const lon2 = line.end.lon;

            const distance = haversineDistance(lat1, lon1, lat2, lon2);
            entityManager.qmlLog(`Distance between (${lat1.toFixed(2)}, ${lon1.toFixed(2)}) and (${lat2.toFixed(2)}, ${lon2.toFixed(2)}): ${distance.toFixed(2)} km`);

            L.polyline([[lat1, lon1], [lat2, lon2]], {
                color: 'black',
                weight: 2
            }).addTo(linesLayer);
        }
    });
}

function removePoint(latlng) {
    const tolerance = 0.01;

    // Find the index of the point to be removed
    const index = points.findIndex(point => {
        return Math.hypot(point.lat - latlng.lat, point.lon - latlng.lng) < tolerance;
    });

    if (index !== -1) {
        // Remove the point from the points array
        points.splice(index, 1);

        // Remove lines that start or end at the point
        lines = lines.filter(line =>
            !(
                (Math.hypot(line.start.lat - latlng.lat, line.start.lon - latlng.lng) < tolerance) ||
                (Math.hypot(line.end.lat - latlng.lat, line.end.lon - latlng.lng) < tolerance)
            )
        );

        // Redraw all layers to reflect changes
        redrawAllLayers();
    } else {
        entityManager.qmlLog("JS: removePoint() found no point, or point is too far away.");
    }
}

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

/* ----------------------------- MAP SETUP ----------------------------- */


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

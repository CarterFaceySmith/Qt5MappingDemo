// Initialize the map
const map = L.map('map').setView([51.505, -0.09], 13); // Center the map at a default location

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to create a custom diamond marker
function createDiamondMarker(latLng, color) {
    const icon = L.divIcon({
        className: 'diamond-icon',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; transform: rotate(45deg);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [12, 12],
    });

    return L.marker(latLng, { icon });
}

// Create the player marker with a colored circle
const playerLatLng = [51.505, -0.09]; // Initial player position
const playerMarker = createDiamondMarker(playerLatLng, 'white').addTo(map);

// Add a circle around the player marker
L.circle(playerLatLng, {
    color: 'white',
    radius: 1000,
    fillOpacity: 0.05
}).addTo(map);

// Create five moving entity markers
const entities = [];
const entityPositions = [
    [51.515, -0.1],
    [51.515, -0.12],
    [51.525, -0.1],
    [51.525, -0.12],
    [51.535, -0.1]
];
const entityCircles = [];
const entityMarkers = entityPositions.map((pos, index) => {
    const color = `hsl(${index * 72}, 100%, 50%)`; // Different colors for each entity
    const marker = createDiamondMarker(pos, color).addTo(map);

    // Create a circle around each entity marker
    const circle = L.circle(pos, {
        color: color,
        radius: 2000, // Radius of the circle
        fillOpacity: 0.05 // No fill
    }).addTo(map);

    entities.push({
        marker,
        color,
        circle,
        originalLatLng: L.latLng(pos),
        direction: Math.random() * 2 * Math.PI, // Random initial direction
        speed: 0.00005,
        stopDuration: Math.random() * 2000 + 2000, // Random stop duration between 2-4 seconds
        timeStopped: 0
    });
    return marker;
});

// Function to animate the entities
function animateEntities() {
    entities.forEach(entity => {
        const { marker, circle, color, speed } = entity;

        function move(timestamp) {
            // Update stop timer
            entity.timeStopped += timestamp - (entity.lastTimestamp || timestamp);
            entity.lastTimestamp = timestamp;

            if (entity.timeStopped < entity.stopDuration) {
                // Continue moving
                const latLng = marker.getLatLng();
                const newLat = latLng.lat + Math.sin(entity.direction) * speed;
                const newLng = latLng.lng + Math.cos(entity.direction) * speed;

                // Set new position for marker
                marker.setLatLng([newLat, newLng]);

                // Set new position for circle
                circle.setLatLng([newLat, newLng]);

                // Randomly change direction occasionally
                if (Math.random() < 0.01) {
                    entity.direction = Math.random() * 2 * Math.PI;
                }

                // Randomly stop or reverse direction occasionally
                if (Math.random() < 0.01) {
                    entity.stopDuration = Math.random() * 2000 + 2000; // Reset stop duration
                    entity.timeStopped = 0;
                } else if (Math.random() < 0.01) {
                    entity.direction += Math.PI; // Reverse direction
                }
            } else {
                // Stop moving
                entity.speed = 0;

                // Randomly restart moving or change direction
                if (Math.random() < 0.01) {
                    entity.speed = 0.00005;
                    entity.stopDuration = Math.random() * 2000 + 2000;
                    entity.timeStopped = 0;
                }
            }

            // Schedule the next frame
            requestAnimationFrame(move);
        }

        move(0); // Initialize timestamp
    });
}

// Start animating entities
animateEntities();

// /* -------------------------- EXTERNAL VARIABLES --------------------------- */
var L, entityManager;
var markersLayer;
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

// /* ------------------------------- WEBCHANNEL ------------------------------- */
function initWebChannel(channel) {
    entityManager = channel.objects.entityManager;
    testSuite();
}

window.onload = function() {
    new QWebChannel(qt.webChannelTransport, initWebChannel);
};

// /* --------------------------- HELPER FUNCTIONS ---------------------------- */
const ANIMATION_RADIUS = 0.001;
const ANIMATION_SPEED = 0.01;
const PATTERN_PERIOD = 5000;

function updateEntityLayer(UID, latLng, radius, color) {
    if (!entityLayers[UID]) return;

    // Remove existing layers
    markersLayer.removeLayer(entityLayers[UID].marker);
    markersLayer.removeLayer(entityLayers[UID].circle);

    // Add new layers
    const marker = L.marker(latLng, { icon: icons.alert });
    const circle = L.circle(latLng, {
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        radius: radius
    });

    marker.addTo(markersLayer);
    circle.addTo(markersLayer);

    // Update the stored layers
    entityLayers[UID] = { marker, circle };
}

function createEntity() {
    if (entityManager) {
        const name = document.getElementById("name").value.trim();
        const UID = document.getElementById("UID").value.trim();
        const radius = parseFloat(document.getElementById("radius").value.trim());
        const latitude = parseFloat(document.getElementById("latitude").value.trim());
        const longitude = parseFloat(document.getElementById("longitude").value.trim());

        const newEntity = entityManager.createEntity(name, UID, radius, latitude, longitude);
        if (newEntity) {
            entityManager.qmlLog("JS: Created entity with name: " + name);
            updateEntityLayer(UID, L.latLng(latitude, longitude), radius, 'orange');
        } else {
            entityManager.qmlLog("JS: Failed to create an entity.");
        }
    }
}

function getEntityByUID() {
    if (entityManager) {
        const UID = document.getElementById("UID").value.trim();
        const entity = entityManager.getEntityByUID(UID);
        if (entity.UID) {
            entityManager.qmlLog("JS: Entity found with UID: " + UID);
        } else {
            entityManager.qmlLog("JS: Entity not found with UID: " + UID);
        }
    }
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

/* ---------------------------- TEST SUITE ------------------------------- */
function testSuite() {
    let testResults = {
        createdEntity: false,
        retrievedLat: false,
        retrievedLng: false,
        retrievedList: false,
        updatedLat: false,
        updatedLng: false,
    };

    if (entityManager) {
        var testEnt = entityManager.createEntity("Test Entity", "TEST", 1000.0, -37.864, 144.963);

        if (testEnt) {
            entityManager.qmlLog("JS: Successfully created test entity with UID TEST.");
            testResults.createdEntity = true;

            var lat, lng, marker, entityList;

            markersLayer = L.layerGroup().addTo(map);

            // Retrieve latitude asynchronously
            var latPromise = new Promise((resolve, reject) => {
                entityManager.getEntityLatRadByUID("TEST", function(resultLat) {
                    if (resultLat !== undefined) {
                        lat = resultLat;
                        resolve(resultLat);
                    } else {
                        reject("Failed to retrieve latitude");
                    }
                });
            });

            // Retrieve longitude asynchronously
            var lngPromise = new Promise((resolve, reject) => {
                entityManager.getEntityLongRadByUID("TEST", function(resultLng) {
                    if (resultLng !== undefined) {
                        lng = resultLng;
                        resolve(resultLng);
                    } else {
                        reject("Failed to retrieve longitude");
                    }
                });
            });

            // Retrieve the list asynchronously
            var listPromise = new Promise((resolve, reject) => {
                entityManager.getEntityList(function(resultList) {
                    if (Array.isArray(resultList)) {
                        entityList = resultList;
                        resolve(resultList);
                    } else {
                        reject("Failed to retrieve list or list is not an array");
                    }
                });
            });

            // Wait for latitude, longitude, and list to be retrieved
            Promise.all([latPromise, lngPromise, listPromise]).then(() => {
                entityManager.qmlLog("JS: Test entity logged latitude of " + lat);
                entityManager.qmlLog("JS: Test entity logged longitude of " + lng);
                entityManager.qmlLog("JS: Received entity list from DB of length " + entityList.length);

                if (lat === -37.864) {
                    entityManager.qmlLog("JS: Latitude assertion passed.");
                    testResults.retrievedLat = true;
                } else {
                    entityManager.qmlLog(`JS: Latitude assertion failed. Expected -37.864, but got ${lat}`);
                }

                if (lng === 144.963) {
                    entityManager.qmlLog("JS: Longitude assertion passed.");
                    testResults.retrievedLng = true;
                } else {
                    entityManager.qmlLog(`JS: Longitude assertion failed. Expected 144.963, but got ${lng}`);
                }

                testResults.retrievedList = Array.isArray(entityList);

                if (testResults.retrievedList) {
                    entityManager.qmlLog("JS: Entity list assertion passed.");
                } else {
                    entityManager.qmlLog("JS: Entity list assertion failed. Expected an array, but got a non-array.");
                }

                if (marker) {
                    markersLayer.removeLayer(marker);
                }

                const latlng = L.latLng(lat, lng);
                marker = L.marker(latlng, { icon: icons.alert }).addTo(markersLayer);

                L.circle(latlng, {
                    color: 'orange',
                    fillColor: 'orange',
                    fillOpacity: 0.2,
                    radius: 1000
                }).addTo(markersLayer);

                entityManager.qmlLog("JS: Added entity marker and circular area to markers layer.");

                entityList.forEach((entity) => {
                    if (entity.latitude !== undefined && entity.longitude !== undefined) {
                        const entityLatLng = L.latLng(entity.latitude, entity.longitude);
                        L.marker(entityLatLng, { icon: icons.alert }).addTo(markersLayer);

                        const circleColor = entity.name && entity.name.startsWith("Devil") ? 'red' : 'blue';

                        L.circle(entityLatLng, {
                            color: circleColor,
                            fillColor: circleColor,
                            fillOpacity: 0.2,
                            radius: 1000
                        }).addTo(markersLayer);
                    } else {
                        entityManager.qmlLog("JS: Entity missing latitude or longitude", entity);
                    }
                });

                // Update the entity and check new values
                var updatePromises = [];

                entityManager.setEntityLongRadByUID("TEST", 144.300);
                updatePromises.push(new Promise((resolve, reject) => {
                    entityManager.getEntityLongRadByUID("TEST", function(updatedLng) {
                        if (updatedLng !== undefined) {
                            resolve(updatedLng);
                        } else {
                            reject("Failed to retrieve updated longitude");
                        }
                    });
                }).then((updatedLng) => {
                    entityManager.qmlLog("JS: Test entity logged an updated longitude of " + updatedLng);
                    if (updatedLng === 144.300) {
                        entityManager.qmlLog("JS: Updated longitude assertion passed.");
                        testResults.updatedLng = true;
                    } else {
                        entityManager.qmlLog(`JS: Updated longitude assertion failed. Expected 144.300, but got ${updatedLng}`);
                    }
                }).catch((error) => {
                    entityManager.qmlLog("JS: Error - " + error);
                }));

                entityManager.setEntityLatRadByUID("TEST", -34.30);
                updatePromises.push(new Promise((resolve, reject) => {
                    entityManager.getEntityLatRadByUID("TEST", function(updatedLat) {
                        if (updatedLat !== undefined) {
                            resolve(updatedLat);
                        } else {
                            reject("Failed to retrieve updated latitude");
                        }
                    });
                }).then((updatedLat) => {
                    entityManager.qmlLog("JS: Test entity logged an updated latitude of " + updatedLat);
                    // Assertion using qmlLog
                    if (updatedLat === -34.30) {
                        entityManager.qmlLog("JS: Updated latitude assertion passed.");
                        testResults.updatedLat = true;
                    } else {
                        entityManager.qmlLog(`JS: Updated latitude assertion failed. Expected -34.30, but got ${updatedLat}`);
                    }
                }).catch((error) => {
                    entityManager.qmlLog("JS: Error - " + error);
                }));

                // Wait for all update promises to complete
                return Promise.all(updatePromises);
            }).catch((error) => {
                entityManager.qmlLog("JS: Error - " + error);
            }).finally(() => {
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
}

/* ----------------------------- MAIN FUNCTION ----------------------------- */
document.addEventListener("DOMContentLoaded", function() {

    /* ----------------------------- MAP SETUP ----------------------------- */
    map = L.map('map').setView([-37.814, 144.963], 13); // Melbourne
    let currentBaseLayer;

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

    updateTileLayer('osm'); // Default map layer

    /* ----------------------------- VARIABLES ----------------------------- */
    const points = [];
    let lines = [];
    let mode = 'scroll';            // Default map mode
    let autoCentreOnPlane = true;
    let userMarker;
    let userRing;
    let userSmallRing;
    let firstPoint = null;

    const markersLayer = L.layerGroup().addTo(map);
    const linesLayer = L.layerGroup().addTo(map);
    const entitiesLayer = L.layerGroup().addTo(map);

    /* ------------------------- INTERNAL FUNCTIONS ------------------------- */
    function redrawAllLayers() {
        drawPoints();
        drawLines();
    }

    function updateUserPosition(latlng) {
        if (userMarker) {
            map.removeLayer(userMarker);
        }
        if (userRing) {
            map.removeLayer(userRing);
        }
        if (userSmallRing) {
            map.removeLayer(userSmallRing);
        }

        userRing = L.circle(latlng, {
            radius: 3000, // Metres
            color: 'orange',
            weight: 2,
            fillOpacity: 0.2
        }).addTo(map);

        userSmallRing = L.circle(latlng, {
             radius: 1000, // Metres
             color: 'orange',
             weight: 2,
             fillOpacity: 0.35,
        }).addTo(map);

        userMarker = L.marker(latlng, { icon: icons.plane }).addTo(map);

        if (autoCentreOnPlane) {
            map.setView(latlng, map.getZoom());
        }
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


    function moveUserPosition(deltaLat, deltaLng) {
        const newLat = userMarker.getLatLng().lat + deltaLat;
        const newLng = userMarker.getLatLng().lng + deltaLng;
        const newLatLng = L.latLng(newLat, newLng);

        updateUserPosition(newLatLng);
    }

    /* ----------------------------- MAIN LOOP ----------------------------- */
    const userPos = {lat: -37.814, lng: 144.963};
    updateUserPosition(userPos);

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
    document.addEventListener('keydown', function(event) {
        const step = 0.001; // Adjust step size as needed

        switch(event.key) {
        case 'ArrowUp':
            moveUserPosition(step, 0);
            break;
        case 'ArrowDown':
            moveUserPosition(-step, 0);
            break;
        case 'ArrowLeft':
            moveUserPosition(0, -step);
            break;
        case 'ArrowRight':
            moveUserPosition(0, step);
            break;
        }
    });

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
});

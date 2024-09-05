const map = L.map('map').setView([-37.814, 144.963], 13); // Melbourne
const ANIMATION_RADIUS = 0.001;
const ANIMATION_SPEED = 0.01;
const PATTERN_PERIOD = 5000;

let currentBaseLayer, userMarker, userRing, entityManager;
let markersLayer = L.layerGroup().addTo(map);
let linesLayer = L.layerGroup().addTo(map);
let entitiesLayer = L.layerGroup().addTo(map);
let entityList, entities, points, lines = [];
let firstPoint = null;
let autoCentreOnPlane = true;

function initWebChannel(channel) {
    entityManager = channel.objects.entityManager;
    testSuite();
}

window.onload = () => new QWebChannel(qt.webChannelTransport, initWebChannel);

function createDiamondMarker(latLng, colour) {
    return L.marker(latLng, {
        icon: L.divIcon({
            className: 'diamond-icon',
            html: `<div style="background-color: ${colour}; width: 20px; height: 20px; transform: rotate(45deg);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    });
}

function updateEntityLayer(UID, latLng, radius, color) {
    if (!entityLayers[UID]) return;

    markersLayer.removeLayer(entityLayers[UID].marker);
    markersLayer.removeLayer(entityLayers[UID].circle);

    const marker = createDiamondMarker(latLng, 'white').addTo(map); // Fixed parameter
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
                if (Array.isArray(resultList)) {
                    resolve(resultList);
                    entityList = resultList;
                } else {
                    reject("Failed to retrieve list or list is not an array");
                }
            });
        });

        Promise.all([latPromise, lngPromise, listPromise])
            .then(([lat, lng, entityList]) => {
                entityManager.qmlLog(`JS: Test entity logged latitude of ${lat}`);
                entityManager.qmlLog(`JS: Test entity logged longitude of ${lng}`);
                entityManager.qmlLog(`JS: Received entity list with ${entityList.length} items`);

                const updateLat = lat + 0.01;
                const updateLng = lng + 0.01;

                // Update entity's latitude and longitude
                const updateLatPromise = new Promise((resolve) => {
                    entityManager.setEntityLatRadByUID("TEST", updateLat, resolve);
                });

                const updateLngPromise = new Promise((resolve) => {
                    entityManager.setEntityLongRadByUID("TEST", updateLng, resolve);
                });

                return Promise.all([updateLatPromise, updateLngPromise]).then(() => {
                    // Verify updates
                    return Promise.all([
                        new Promise((resolve) => {
                            entityManager.getEntityLatRadByUID("TEST", resultLat => {
                                resolve(resultLat);
                            });
                        }),
                        new Promise((resolve) => {
                            entityManager.getEntityLongRadByUID("TEST", resultLng => {
                                resolve(resultLng);
                            });
                        })
                    ]).then(([updatedLat, updatedLng]) => {
                        if (updatedLat === updateLat) {
                            entityManager.qmlLog("JS: Latitude update assertion passed.");
                            testResults.updatedLat = true;
                        } else {
                            entityManager.qmlLog(`JS: Latitude update assertion failed. Expected ${updateLat}, but got ${updatedLat}`);
                        }

                        if (updatedLng === updateLng) {
                            entityManager.qmlLog("JS: Longitude update assertion passed.");
                            testResults.updatedLng = true;
                        } else {
                            entityManager.qmlLog(`JS: Longitude update assertion failed. Expected ${updateLng}, but got ${updatedLng}`);
                        }
                    });
                });
            })
            .catch(error => {
                entityManager.qmlLog(`JS: ${error}`);
            })
            .finally(() => {
                // Print list and summary
                entityManager.printAllEntities();

                let passCount = Object.values(testResults).filter(v => v === true).length;
                let totalTests = Object.keys(testResults).length;
                let summary = `Test Summary: ${passCount}/${totalTests} tests passed.`;

                entityManager.qmlLog("JS: " + summary);
                console.log(summary); // Log to console as well in case
            });
    }
}

// Function to animate entities
function animateEntities() {
    entityManager.qmlLog("JS: Entered animateEntities loop, current entities list length: ", entities.length);

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

currentBaseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
const userLatLng = [-37.814, 144.963];
userMarker = createDiamondMarker(userLatLng, 'white').addTo(map);
userRing = L.circle(userLatLng, { color: 'white', radius: 1000, fillOpacity: 0.05 }).addTo(map);
entityManager.qmlLog("JS: User entity drawn, mapping to entities list now");

entities = entityList.map((entity, index) => {
    if (entity.latitude !== undefined && entity.longitude !== undefined) {
        const entityLatLng = L.latLng(entity.latitude, entity.longitude);
        const color = `hsl(${index * 72}, 100%, 50%)`;
        const marker = createDiamondMarker(entityLatLng, color).addTo(map);
        const circle = L.circle(entityLatLng, { color, radius: 2000, fillOpacity: 0.05 }).addTo(map);
        entityManager.qmlLog("JS: Wrote to entities list, now of length: ", entities.length);

        return {
            marker,
            circle,
            latLng: entityLatLng,
            direction: Math.random() * 2 * Math.PI,
            speed: 0.0001,
            stopDuration: Math.random() * 2000 + 2000,
            timeStopped: 0,
            lastTimestamp: 0
        };
    }
    else {
        entityManager.qmlLog("JS: Entity missing latitude or longitude", entity);
        return null; // Filter out entities without valid positions
    }

}).filter(entity => entity !== null); // Filter out null entities

// const color = `hsl(${1 * 72}, 100%, 50%)`;
// const entLatLng = [entityList[0].latitude, entities[0].longitude];
// const marker = createDiamondMarker(entLatLng, color).addTo(map);
// const circle = L.circle([-37.814, 144.961], { color, radius: 2000, fillOpacity: 0.05 }).addTo(map);

animateEntities();

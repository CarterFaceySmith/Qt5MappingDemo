/* -------------------------- EXTERNAL VARIABLES --------------------------- */
var map;
var entityManager;
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
                        draggable: true // FIXME: Draggable icons not working - potential map layering issue?
                    }),
    heart: L.divIcon({
                         className: 'additional-icon',
                         html: '<i class="material-icons">favorite</i>',
                         iconSize: [24, 24],
                         iconAnchor: [12, 12],
                     }),
    check: L.divIcon({
                         className: 'additional-icon',
                         html: '<i class="material-icons">check</i>',
                         iconSize: [24, 24],
                         iconAnchor: [12, 12],
                     }),
    alert: L.divIcon({
                         className: 'additional-icon',
                         html: '<i class="material-icons">warning</i>',
                         iconSize: [24, 24],
                         iconAnchor: [12, 12],
                     })
};

/* ------------------------------- WEBCHANNEL ------------------------------- */
function initWebChannel(channel) {
    entityManager = channel.objects.entityManager;
    testSuite();
}

window.onload = function() {
    var channel = new QWebChannel(qt.webChannelTransport, initWebChannel);
};

/* --------------------------- EXTERNAL FUNCTIONS --------------------------- */
function printAllEntities(){ entityManager.printAllEntities() }

function createEntity() {
    if (entityManager) {
        var name = document.getElementById("name").value.trim();
        var UID = document.getElementById("UID").value.trim();
        var radius = parseFloat(document.getElementById("radius").value.trim());
        var latitude = parseFloat(document.getElementById("latitude").value.trim());
        var longitude = parseFloat(document.getElementById("longitude").value.trim());

        var newEntity = entityManager.createEntity(name, UID, radius, latitude, longitude);
        if (newEntity) {
            entityManager.qmlLog("JS: createEntity() created entity with name: " + name);
            // TODO:  Place marker for the fetched entity
        }
        else {
            entityManager.qmlLog("JS: createEntity() failed to create an entity.");
        }
    }
}

function getEntityByUID() {
    if (entityManager) {
        var UID = document.getElementById("UID").value.trim();
        var entity = entityManager.getEntityByUID(UID);
        if (entity.UID !== "") {
            entityManager.qmlLog("JS: Entity found from getEntityByUID with UID: " + UID);
            placeMarkerForEntity(entity); // Place marker for the fetched entity
        } else {
            entityManager.qmlLog("JS: Entity not found from getEntityByUID.");
        }
    }
}

function updateEntityId() {
    if (entityManager) {
        var currentId = document.getElementById("UID").value.trim();
        var newId = document.getElementById("newId").value.trim();
        entityManager.updateEntityId(currentId, newId);
    }
}

// FIXME: Not working currently, receiving Promise object instead of list.
function getEntities() {
    if (entityManager) {
        var entities;
        entityManager.getEntityList(function(entities) {
            entityManager.qmlLog("JS: Attempting to retrieve entity list from backend.");
        });
        entityManager.qmlLog("JS: Received entity list of length: " + entities.length + " in JS.");

        // var entityDatabaseModel = [];

        // // Iterate through the list of QObject pointers
        // for (var i = 0; i < entities.length; ++i) {
        //     var entity = entities[i];
        //     // Access the properties and push to the model
        //     entityDatabaseModel.push({
        //         name: entity.name,
        //         UID: entity.UID,
        //         radius: entity.radius,
        //         latitude: entity.latitude,
        //         longitude: entity.longitude
        //     });
        // }
        // logMessage("JS: Moved entities to entityDatabaseModel of length: " + entityDatabaseModel.length + " in JS.");

        // return entityDatabaseModel;
    }
    else {
        entityManager.qmlLog("JS: No entities in database.");
        return [];
    }
}

function logMessage() {
    if (entityManager) {
        var message = document.getElementById("logMessage").value.trim();
        entityManager.logMessage(message);
    }
}

function testSuite() {
    if (entityManager) {
        // Create the entity
        var testEnt = entityManager.createEntity("Test Entity", "TEST", 1000.0, -37.864, 144.963);
        if (testEnt) {
            entityManager.qmlLog("JS: Successfully created test entity with UID TEST.");

            // Retrieve latitude and longitude asynchronously
            var lat, lng;
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

            // Wait for both latitude and longitude to be retrieved
            Promise.all([latPromise, lngPromise]).then(() => {
                entityManager.qmlLog("JS: Test entity logged latitude of " + lat);
                entityManager.qmlLog("JS: Test entity logged longitude of " + lng);

                // Use latitude and longitude to create a marker
                const latlng = L.latLng(lat, lng);
                L.marker(latlng, { icon: icons.alert }).addTo(map);

                // Add a circular area around the entity marker
                L.circle(latlng, {
                    color: 'orange',
                    fillColor: 'orange',
                    fillOpacity: 0.2,
                    radius: 1000
                }).addTo(map);

                entityManager.qmlLog("JS: Added entity marker and circular area to base map layer.");
            }).catch((error) => {
                entityManager.qmlLog("JS: Error - " + error);
            });

            // Optionally update the longitude
            entityManager.setEntityLongRadByUID("TEST", lng);
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

    testSuite(); // Run default test suite function

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
            color: '#FF5722',
            weight: 2,
            fillOpacity: 0.15
        }).addTo(map);

        userSmallRing = L.circle(latlng, {
             radius: 1000, // Metres
             color: '#FF5722',
             weight: 2,
             fillOpacity: 0.3,
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

    function drawLines() {
        linesLayer.clearLayers();
        lines.forEach(line => {
            if (line.start && line.end) {
                L.polyline([[line.start.lat, line.start.lon],
                            [line.end.lat, line.end.lon]], {
                            color: 'black',
                            weight: 2
                }).addTo(linesLayer);
            }
        });
    }

    function removePoint(latlng) {
        const tolerance = 0.01;

        const index = points.findIndex(point => {
            return Math.hypot(point.lat - latlng.lat, point.lon - latlng.lng) < tolerance;
        });

        if (index !== -1) {
            points.splice(index, 1);
            lines = lines.filter(line => line.start !== points[index] && line.end !== points[index]);
            redrawAllLayers();
        }

        else {
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

    document.getElementById('draw-entity-markers').addEventListener('click', function() {
        drawEntityMarkers();
    });

    document.getElementById('place-carter').addEventListener('click', function() {
        placeCarter();
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

// Access the QML/C++ EntityManager object hopefully
const entityManager = Qt.binding(function() { return entityManager; });

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

function updateEntityId(newId) {
    console.log("Updating entity ID to:", newId);
}

// Factory function entity creation
function createEntity(name, UID, icon, radius, latitude, longitude) {
    return entityManager.createEntity(name, UID, icon, radius, latitude, longitude);
}

function getEntityByUID(UID) {
    const entity = entityManager.getEntityByUID(UID);
    return entity;
}

function listAllEntities() {
    const entities = entityManager.listAllEntities();
    return entities;
}

// Example usage
console.log('All Entities:');
console.log(listAllEntities());

console.log('\nRetrieving Entity with UID UID002:');
const entity = getEntityByUID('UID002');
if (entity) {
    console.log(`Name: ${entity.name}`);
    console.log(`UID: ${entity.UID}`);
    console.log(`Radius: ${entity.radius}`);
    console.log(`Latitude: ${entity.latitude}`);
    console.log(`Longitude: ${entity.longitude}`);
} else {
    console.log('Entity not found.');
}

document.addEventListener("DOMContentLoaded", function() {
    const map = L.map('map').setView([-37.814, 144.963], 13); // Melbourne

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

    updateTileLayer('osm'); // Set default layer to OpenStreetMap

    const points = [];
    let lines = [];
    let mode = 'scroll'; // Default mode
    let autoCentreOnPlane = false; // Toggle for auto-centreing

    const markersLayer = L.layerGroup().addTo(map);
    const linesLayer = L.layerGroup().addTo(map);

    let userMarker;
    let userRing;
    let userSmallRing;

    // Function to update user position marker and rings
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
                                radius: 3000, // Radius of the large ring in metres
                                color: '#FF5722', // Orange
                                weight: 2,
                                fillOpacity: 0.15
                            }).addTo(map);

        userSmallRing = L.circle(latlng, {
                                     radius: 1000, // Radius of the small ring in metres
                                     color: '#FF5722', // Orange
                                     weight: 2,
                                     fillOpacity: 0.3,
                                     strokeDasharray: '2, 6' // Smaller dotted border attempt - no idea why this is solid
                                 }).addTo(map);

        userMarker = L.marker(latlng, { icon: icons.plane }).addTo(map);

        if (autoCentreOnPlane) {
            map.setView(latlng, map.getZoom());
        }
    }

    const user = createEntity('User', 'UID1USER', icons.user, 700, -37.814, 144.963);
    updateUserPosition({lat: user.lat, lng: user.long});

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
                              L.polyline([[line.start.lat, line.start.lon], [line.end.lat, line.end.lon]], {
                                             color: 'black',
                                             weight: 2
                                         }).addTo(linesLayer);
                          }
                      });
    }

    function removePoint(latlng) {
        // Define the tolerance for point removal
        const tolerance = 0.01; // Adjust this value as needed

        // Find index of the point to remove based on distance
        const index = points.findIndex(point => {
                                           return Math.hypot(point.lat - latlng.lat, point.lon - latlng.lng) < tolerance;
                                       });

        if (index !== -1) {
            // Remove the point
            points.splice(index, 1);
            // Remove associated lines
            lines = lines.filter(line => line.start !== points[index] && line.end !== points[index]);

            // Redraw points and lines
            drawPoints();
            drawLines();

            /* alert("Point removed successfully!"); */
        } else {
            alert("No point found or point is too far away."); // Feedback
        }
    }


    let firstPoint = null;

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
        } else if (mode === 'demo-entities') {
            initEntities();
            // Init entity and push to entity manager

        } else if (mode === 'draw-line') {
            if (firstPoint === null) {
                firstPoint = { lat: coords.lat, lon: coords.lng };
            } else {
                const secondPoint = { lat: coords.lat, lon: coords.lng };
                lines.push({ start: firstPoint, end: secondPoint });
                drawLines();
                firstPoint = null; // Reset for the next line
            }
        } else if (mode === 'remove-point') {
            removePoint(coords);
        }
    });

    function moveUserPosition(deltaLat, deltaLng) {
        const newLat = userMarker.getLatLng().lat + deltaLat;
        const newLng = userMarker.getLatLng().lng + deltaLng;
        const newLatLng = L.latLng(newLat, newLng);

        updateUserPosition(newLatLng);
    }

    // Create and show the modal
    const modal = document.getElementById('entityModal');
    const btn = document.getElementById('openModal');
    const span = document.getElementsByClassName('close')[0];

    btn.onclick = function() {
        modal.style.display = "block";
    }

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }

    document.getElementById('entityForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const name = document.getElementById('entityName').value;
        const id = document.getElementById('entityId').value;
        const iconType = document.getElementById('entityIcon').value;
        const lat = parseFloat(document.getElementById('entityLat').value);
        const long = parseFloat(document.getElementById('entityLong').value);

        const entity = createEntity(name, id, icons[iconType], 700, lat, long);
        database.push(entity);

        L.marker([lat, long], { icon: entity.icon }).addTo(map);
        L.circle([lat, long], {
                     radius: 3000,
                     color: '#FF0000',
                     weight: 2,
                     opacity: 0.5,
                     fillOpacity: 0.1
                 }).addTo(map);

        // Hide the modal and clear the form
        modal.style.display = "none";
        document.getElementById('entityForm').reset();
    });

    document.addEventListener('keydown', function(event) {
        const step = 0.001; // Adjust step size

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
        document.getElementById('demo-entities').classList.remove('active');
        firstPoint = null; // Reset line drawing mode
    });

    document.getElementById('scroll').addEventListener('click', function() {
        mode = 'scroll';
        this.classList.add('active');
        document.getElementById('add-point').classList.remove('active');
        document.getElementById('remove-point').classList.remove('active');
        document.getElementById('draw-line').classList.remove('active');
        document.getElementById('demo-entities').classList.remove('active');
        firstPoint = null; // Reset line drawing mode
    });

    document.getElementById('draw-line').addEventListener('click', function() {
        mode = 'draw-line';
        this.classList.add('active');
        document.getElementById('add-point').classList.remove('active');
        document.getElementById('remove-point').classList.remove('active');
        document.getElementById('scroll').classList.remove('active');
        document.getElementById('demo-entities').classList.remove('active');
        firstPoint = null; // Reset line drawing mode
    });

    document.getElementById('remove-point').addEventListener('click', function() {
        mode = 'remove-point';
        this.classList.add('active');
        document.getElementById('add-point').classList.remove('active');
        document.getElementById('draw-line').classList.remove('active');
        document.getElementById('scroll').classList.remove('active');
        document.getElementById('demo-entities').classList.remove('active');

        firstPoint = null; // Reset line drawing mode
    });

    document.getElementById('map-mode').addEventListener('change', function() {
        updateTileLayer(this.value);
    });

    document.getElementById('toggle-centre').addEventListener('click', function() {
        autoCentreOnPlane = !autoCentreOnPlane;
        this.classList.toggle('active', autoCentreOnPlane);
    });


    // Init Entities from C++ EntityManager
    function initEntities() {
        // Clear existing markers
        markersLayer.clearLayers();
        linesLayer.clearLayers();

        const entities = listAllEntities();
        entities.forEach(entity => {
            if (!entity.latitude || !entity.longitude || !entity.icon) {
                console.error('Entity is missing required properties:', entity);
                return;
            }

            L.marker([entity.latitude, entity.longitude], { icon: icons[entity.icon] }).addTo(map);

            L.circle([entity.latitude, entity.longitude], {
                radius: entity.radius,
                color: '#FF0000',
                weight: 2,
                opacity: 0.5,
                fillOpacity: 0.1
            }).addTo(map);
        });
    }

    document.getElementById('demo-entities').addEventListener('click', function() {
        mode = 'demo-entities';
        this.classList.add('active');
        document.getElementById('draw-line').classList.remove('active');
        document.getElementById('remove-point').classList.remove('active');
        document.getElementById('scroll').classList.remove('active');
        document.getElementById('add-point').classList.remove('active');
        firstPoint = null; // Reset line drawing mode

        // Call function to initialize entities
        initEntities();
    });

    // Handle form submission
    document.getElementById('entityForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const name = document.getElementById('entityName').value;
        const id = document.getElementById('entityId').value;
        const iconType = document.getElementById('entityIcon').value;
        const lat = parseFloat(document.getElementById('entityLat').value);
        const long = parseFloat(document.getElementById('entityLong').value);

        const entity = createEntity(name, id, iconType, 700, lat, long);
        L.marker([lat, long], { icon: entity.icon }).addTo(map);
        L.circle([lat, long], {
                     radius: 3000,
                     color: '#FF0000',
                     weight: 2,
                     opacity: 0.5,
                     fillOpacity: 0.1
                 }).addTo(map);

        // Hide the modal and clear the form
        modal.style.display = "none";
        document.getElementById('entityForm').reset();
    });
});

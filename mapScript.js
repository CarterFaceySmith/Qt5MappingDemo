/* ----------------------------- WEBCHANNEL ----------------------------- */
function initWebChannel(channel) {
    entityManager = channel.objects.entityManagerQt;
    entity = channel.objects.entityQt;
}

window.onload = function() {
    var channel = new QWebChannel(qt.webChannelTransport, initWebChannel);
};

function logMessage() {
    if (entity) {
        entity.e_TransportMessage("Hello from JS frontend!");
        entity.e_radius();
    } else {
        console.log("entity is not available yet.");
    }

    if (entityManager) {
        entityManager.em_TransportMessage("Hello from JS frontend!");
    } else {
        console.log("entityManager is not available yet.");
    }
}

/* -------------------------- EXTERNAL VARIABLES --------------------------- */
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

/* ----------------------------- MAIN FUNCTION ----------------------------- */
document.addEventListener("DOMContentLoaded", function() {

    /* ----------------------------- MAP SETUP ----------------------------- */
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

    updateTileLayer('osm'); // Default map layer

    /* ----------------------------- VARIABLES ----------------------------- */
    const points = [];
    let lines = [];
    let mode = 'scroll'; // Default mode
    let autoCentreOnPlane = true; // Toggle for auto-centre
    let userMarker;
    let userRing;
    let userSmallRing;
    let firstPoint = null;

    const markersLayer = L.layerGroup().addTo(map);
    const linesLayer = L.layerGroup().addTo(map);

    // database.forEach(entity => {
    //     L.marker([entity.lat, entity.long], { icon: entity.icon }).addTo(map);

    //     L.circle([entity.lat, entity.long], {
    //         radius: 3000,
    //         color: entity.icon.options.html.includes('red') ? '#FF0000' :
    //         entity.icon.options.html.includes('blue') ? '#0000FF' :
    //         entity.icon.options.html.includes('green') ? '#00FF00' :
    //         '#800080',
    //         weight: 2,
    //         opacity: 0.5,
    //         fillOpacity: 0.1
    //     }).addTo(map);
    // });

    /* ----------------------------- FUNCTIONS ----------------------------- */
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

        } else {
            alert("No point found or point is too far away."); // Error feedback
        }
    }

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

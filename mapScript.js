// class Entity {
//     constructor(name, UID, radius) {
//         this.name = name;
//         this.UID = UID;
//         this.radius = radius;
//     }

//     getName() { return this.name; }
//     getUID() { return this.UID; }
//     getRadius() { return this.radius; }
// }

// No need to define class explicitly?

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

// Factory function to create entities
function createEntity(name, UID, icon, radius, latitude, longitude) {
  return {
    name: name,
    UID: UID,
    icon: icon,
    radius: radius,
    lat: latitude,
    long: longitude,
    getName() { return this.name; },
    getUID() { return this.UID; },
    getIcon() { return this.icon; },
    getRadius() { return this.radius; },
    getLat() { return this.lat; },
    getLong() { return this.long; }
  };
}

// Simulating a database with an array
const database = [];

// Adding entities to the "database"
database.push(createEntity('Entity1', 'UID001', icons.heart, 700, -37.804, 144.913));
database.push(createEntity('Entity2', 'UID002', icons.star, 700, -37.824, 144.933));
database.push(createEntity('Entity3', 'UID003', icons.alert, 700, -37.844, 144.953));

// Function to retrieve an entity by UID
function getEntityByUID(UID) {
  return database.find(entity => entity.getUID() === UID);
}

// Function to list all entities
function listAllEntities() {
  return database.map(entity => ({
    Name: entity.getName(),
    UID: entity.getUID(),
    Radius: entity.getRadius(),
    Latitude: entity.getLat(),
    Longitude: entity.getLong()
  }));
}

// Example usage
console.log('All Entities:');
console.log(listAllEntities());

console.log('\nRetrieving Entity with UID UID002:');
const entity = getEntityByUID('UID002');
if (entity) {
  console.log(`Name: ${entity.getName()}`);
  console.log(`UID: ${entity.getUID()}`);
  console.log(`Radius: ${entity.getRadius()}`);
  console.log(`Latitude: ${entity.getLat()}`);
  console.log(`Longitude: ${entity.getLong()}`);
} else {
  console.log('Entity not found.');
}

/*
JS Factory Pattern Usage:
// Creating an instance
const entity1 = createEntity('Carter', 'XYZ123', 70);

// Accessing properties
console.log(person3.getName()); // Output: Carter
*/

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

    // const userPosition = { lat: -37.814, lng: 144.963 }; // Central Melbourne
    const user = createEntity('User', 'UID1USER', icons.user, 700, -37.814, 144.963);
    updateUserPosition({lat: user.lat, lng: user.long});

    database.forEach(entity => {
        L.marker([entity.lat, entity.long], { icon: entity.icon }).addTo(map);

        L.circle([entity.lat, entity.long], {
            radius: 3000,
            color: entity.icon.options.html.includes('red') ? '#FF0000' :
            entity.icon.options.html.includes('blue') ? '#0000FF' :
            entity.icon.options.html.includes('green') ? '#00FF00' :
            '#800080',
            weight: 2,
            opacity: 0.5,
            fillOpacity: 0.1
        }).addTo(map);
    });

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

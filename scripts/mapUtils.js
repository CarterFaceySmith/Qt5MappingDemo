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

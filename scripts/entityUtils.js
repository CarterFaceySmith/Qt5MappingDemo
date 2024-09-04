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

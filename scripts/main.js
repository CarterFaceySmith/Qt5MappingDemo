// Configuration
const CONFIG = {
    initialView: {
        lat: -37.814,
        lng: 144.963,
        zoom: 13
    },
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    animationParams: {
        radius: 0.001,
        speed: 0.01,
        period: 5000
    }
};

// Main application object
const MapApp = {
    map: null,
    layers: {
        base: null,
        markers: null,
        lines: null,
        entities: null
    },
    entityManager: null,
    entities: new Map(),
    userMarker: null,
    userRing: null,
    autoCentreOnPlane: true,
    animationFrame: null,

    async init() {
        this.initMap();
        await this.initWebChannel();
        await this.runTests();
        this.initEntities();
        this.bindEvents();
        this.startAnimation();
    },

    initMap() {
        this.map = L.map('map').setView([CONFIG.initialView.lat, CONFIG.initialView.lng], CONFIG.initialView.zoom);
        this.layers.base = L.tileLayer(CONFIG.tileLayer).addTo(this.map);
        this.layers.markers = L.layerGroup().addTo(this.map);
        this.layers.lines = L.layerGroup().addTo(this.map);
        this.layers.entities = L.layerGroup().addTo(this.map);
    },

    async initWebChannel() {
        return new Promise((resolve, reject) => {
            new QWebChannel(qt.webChannelTransport, channel => {
                this.entityManager = channel.objects.entityManager;
                if (this.entityManager) {
                    resolve();
                } else {
                    reject(new Error('Failed to initialize entityManager'));
                }
            });
        });
    },

    async runTests() {
        // Implement your test suite here
        // For brevity, I'm not including the full test implementation
        this.log('Running tests...');
        // Simulating async tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.log('Tests completed');
    },

    async initEntities() {
        const entityList = await this.getEntityList();
        entityList.forEach(this.addEntity.bind(this));
        this.initUserMarker();
    },

    async getEntityList() {
        return new Promise(resolve => {
            this.entityManager.getEntityList(list => resolve(list));
        });
    },

    // addEntity(entity) {
    //     const latLng = L.latLng(entity.latitude, entity.longitude);
    //     const color = this.getRandomColor();
    //     const marker = this.createDiamondMarker(latLng, color).addTo(this.layers.entities);
    //     const circle = L.circle(latLng, { color, radius: 2000, fillOpacity: 0.05 }).addTo(this.layers.entities);

    //     this.entities.set(entity.UID, {
    //         marker,
    //         circle,
    //         latLng,
    //         direction: Math.random() * 2 * Math.PI,
    //         speed: 0.0001,
    //         stopDuration: Math.random() * 2000 + 2000,
    //         timeStopped: 0,
    //         lastTimestamp: 0
    //     });
    // },

    initUserMarker() {
        const userLatLng = L.latLng(CONFIG.initialView.lat, CONFIG.initialView.lng);
        this.userMarker = this.createDiamondMarker(userLatLng, 'white').addTo(this.map);
        this.userRing = L.circle(userLatLng, { color: 'white', radius: 1000, fillOpacity: 0.05 }).addTo(this.map);
    },

    createDiamondMarker(latLng, color) {
        return L.marker(latLng, {
            icon: L.divIcon({
                className: 'diamond-icon',
                html: `<div style="background-color: ${color}; width: 20px; height: 20px; transform: rotate(45deg);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        });
    },

    getRandomColor() {
        return `hsl(${Math.random() * 360}, 100%, 50%)`;
    },

    bindEvents() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        // Add more event listeners as needed
    },

    handleKeyPress(event) {
        const step = 0.001;
        switch(event.key) {
            case 'ArrowUp': this.moveUserMarker(step, 0); break;
            case 'ArrowDown': this.moveUserMarker(-step, 0); break;
            case 'ArrowLeft': this.moveUserMarker(0, -step); break;
            case 'ArrowRight': this.moveUserMarker(0, step); break;
        }
    },

    moveUserMarker(deltaLat, deltaLng) {
        const newLat = this.userMarker.getLatLng().lat + deltaLat;
        const newLng = this.userMarker.getLatLng().lng + deltaLng;
        const newLatLng = L.latLng(newLat, newLng);
        this.updateUserPosition(newLatLng);
    },

    updateUserPosition(latLng) {
        this.userMarker.setLatLng(latLng);
        this.userRing.setLatLng(latLng);
        if (this.autoCentreOnPlane) {
            this.map.setView(latLng);
        }
    },

    startAnimation() {
        const animate = (timestamp) => {
            this.entities.forEach(entity => this.animateEntity(entity, timestamp));
            this.animationFrame = requestAnimationFrame(animate);
        };
        this.animationFrame = requestAnimationFrame(animate);
    },

    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    },

    animateEntity(entity, timestamp) {
        entity.timeStopped += timestamp - (entity.lastTimestamp || timestamp);
        entity.lastTimestamp = timestamp;

        if (entity.timeStopped < entity.stopDuration) {
            const latLng = entity.marker.getLatLng();
            const newLatLng = L.latLng(
                latLng.lat + Math.sin(entity.direction) * entity.speed,
                latLng.lng + Math.cos(entity.direction) * entity.speed
            );

            entity.marker.setLatLng(newLatLng);
            entity.circle.setLatLng(newLatLng);

            // Update backend entity position
            this.updateEntityPosition(entity.marker.options.title, newLatLng);

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
    },

    updateEntityPosition(UID, latLng) {
        if (this.entityManager) {
            const latRad = this.degToRad(latLng.lat);
            const lngRad = this.degToRad(latLng.lng);
            this.entityManager.setEntityLatRadByUID(UID, latRad);
            this.entityManager.setEntityLongRadByUID(UID, lngRad);
        }
    },

    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    addEntity(entity) {
        const latLng = L.latLng(entity.latitude, entity.longitude);
        const color = this.getRandomColor();
        const marker = this.createDiamondMarker(latLng, color).addTo(this.layers.entities);
        marker.options.title = entity.UID; // Add UID to marker for reference

        const circle = L.circle(latLng, { color, radius: 2000, fillOpacity: 0.05 }).addTo(this.layers.entities);

        this.entities.set(entity.UID, {
            marker,
            circle,
            latLng,
            direction: Math.random() * 2 * Math.PI,
            speed: 0.0001,
            stopDuration: Math.random() * 2000 + 2000,
            timeStopped: 0,
            lastTimestamp: 0
        });
    },

    log(message) {
        if (this.entityManager) {
            this.entityManager.qmlLog(`JS: ${message}`);
        }
        console.log(message);
    }
};

// Initialize the application when the window loads
window.onload = () => MapApp.init().catch(error => console.error('Initialization error:', error));

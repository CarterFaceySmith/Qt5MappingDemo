// Configuration
const CONFIG = {
    initialView: {
        lat: -37.814,
        lng: 144.963,
        zoom: 13
    },
    tileLayer: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
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
        entities: null,
        emitters: null
    },
    entityManager: null,
    networkWrapper: null,
    entities: new Map(),
    emitters: new Map(),
    userMarker: null,
    userRing: null,
    autoCentreOnPlane: true,
    animationFrame: null,
    lastFrameTime: 0,

    // FIXME: Junk test data, remove
    emitterData: [
    ],

    async init() {
        this.initMap();
        await this.initWebChannel();
        await this.initEntities();
        this.initEmitters();
        this.bindEvents();
        this.startAnimation();
        this.initHUD();
        this.initLayerControls();
    },

    initMap() {
        this.map = L.map('map', { zoomControl: false }).setView([CONFIG.initialView.lat, CONFIG.initialView.lng], CONFIG.initialView.zoom);
        this.layers.base = L.tileLayer(CONFIG.tileLayer, {
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);
        this.layers.markers = L.layerGroup().addTo(this.map);
        this.layers.lines = L.layerGroup().addTo(this.map);
        this.layers.entities = L.layerGroup().addTo(this.map);
        this.layers.emitters = L.layerGroup().addTo(this.map);
    },

    async initWebChannel() {
        return new Promise((resolve, reject) => {
            new QWebChannel(qt.webChannelTransport, channel => {
                this.entityManager = channel.objects.entityManager;
                this.networkWrapper = channel.objects.networkWrapper;
                if (this.entityManager && this.networkWrapper) {
                    resolve();
                } else {
                    reject(new Error('Failed to initialise entityManager or networkWrapper'));
                }
            });
        });
    },

    async initEntities() {
        const entityList = await this.getEntityList();
        entityList.forEach(this.addEntity.bind(this));
        this.initUserMarker();
    },

    initEmitters() {
        this.emitterData.forEach(this.addEmitter.bind(this));
        this.addRandomEmitters(5);
    },

    addRandomEmitters(count) {
        const emitterTypes = ["RADAR", "RADIO", "JAMMER", "UNKNOWN"];
        for (let i = 0; i < count; i++) {
            const randomEmitter = {
                UID: `TEST_EMITTER_${i + 1}`,
                latitude: CONFIG.initialView.lat + (Math.random() - 0.5) * 0.3,
                longitude: CONFIG.initialView.lng + (Math.random() - 0.5) * 0.3,
                type: emitterTypes[Math.floor(Math.random() * emitterTypes.length)]
            };
            this.emitterData.push(randomEmitter);
            this.addEmitter(randomEmitter);
        }
    },

    async getEntityList() {
        return new Promise(resolve => {
            this.entityManager.getEntityList(list => resolve(list));
        });
    },

    async getEmitterList() {
        return new Promise(resolve => {
            this.entityManager.getEmitterList(list => resolve(list));
        });
    },

    addEntity(entity) {
        const latLng = L.latLng(entity.latitude, entity.longitude);
        const marker = this.createEntityMarker(latLng).addTo(this.layers.entities);
        marker.options.title = entity.UID;

        const circle = L.circle(latLng, {
            color: 'white',
            weight: 1,
            fillColor: 'white',
            fillOpacity: 0.1,
            radius: 2000
        }).addTo(this.layers.entities);

        this.entities.set(entity.UID, {
            marker,
            circle,
            latLng,
            heading: Math.random() * 360,
            speed: 0.0001 + Math.random() * 0.0001, // Varying speeds
            altitude: 5000 + Math.random() * 35000, // Random altitude between 5,000 and 40,000 feet
            turnRate: 0,
            lastUpdate: Date.now()
        });
    },

    createEntityMarker(latLng) {
        return L.marker(latLng, {
            icon: L.divIcon({
                className: 'entity-icon',
                html: `<svg width="20" height="20" viewBox="0 0 20 20">
                <polygon points="10,1 19,10 10,19 1,10" fill="none" stroke="white" stroke-width="2"/>
                </svg>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        });
    },

    addEmitter(emitter) {
        const latLng = L.latLng(emitter.latitude, emitter.longitude);
        const marker = this.createEmitterMarker(latLng, emitter.type).addTo(this.layers.emitters);
        marker.options.title = `${emitter.UID} (${emitter.type})`;

        const circle = L.circle(latLng, {
            color: this.getEmitterColor(emitter.type),
            weight: 1,
            fillColor: this.getEmitterColor(emitter.type),
            fillOpacity: 0.1,
            radius: this.getEmitterRadius(emitter.type)
        }).addTo(this.layers.emitters);

        this.emitters.set(emitter.UID, {
            marker,
            circle,
            latLng,
            type: emitter.type,
            lastUpdate: Date.now(),
        });
    },

    createEmitterMarker(latLng, type) {
        const color = this.getEmitterColor(type);
        return L.marker(latLng, {
            icon: L.divIcon({
                className: 'emitter-icon',
                html: `<svg width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="5" fill="${color}" />
                <circle cx="10" cy="10" r="8" fill="none" stroke="${color}" stroke-width="2" />
                </svg>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        });
    },

    getEmitterColor(type) {
        switch (type) {
            case "RADAR": return "#ff0000";
            case "RADIO": return "#00ff00";
            case "JAMMER": return "#ff00ff";
            default: return "#ffff00";
        }
    },

    getEmitterRadius(type) {
        switch (type) {
            case "RADAR": return 7000;
            case "RADIO": return 5000;
            case "JAMMER": return 3000;
            default: return 4000;
        }
    },

    initUserMarker() {
        const userLatLng = L.latLng(CONFIG.initialView.lat, CONFIG.initialView.lng);

        this.userMarker = L.circleMarker(userLatLng, {
            radius: 6,
            fillColor: '#00ff00',
            color: '#00ff00',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
        }).addTo(this.map);

        this.userRing = L.circle(userLatLng, {
            color: '#00ff00',
            weight: 1,
            fillColor: '#00ff00',
            fillOpacity: 0.05,
            radius: 1000
        }).addTo(this.map);
    },

    bindEvents() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
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
        this.animateUserMarker(newLatLng);
    },

    animateUserMarker(targetLatLng) {
        const startLatLng = this.userMarker.getLatLng();
        const startTime = Date.now();
        const duration = 500;

        const animate = () => {
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            const newLat = startLatLng.lat + (targetLatLng.lat - startLatLng.lat) * progress;
            const newLng = startLatLng.lng + (targetLatLng.lng - startLatLng.lng) * progress;
            const newLatLng = L.latLng(newLat, newLng);

            this.updateUserPosition(newLatLng);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    },

    updateUserPosition(latLng) {
        this.userMarker.setLatLng(latLng);
        this.userRing.setLatLng(latLng);
        if (this.autoCentreOnPlane) {
            this.map.setView(latLng);
        }
        // Update backend user position
        this.updateEntityPosition('CHARIOT', latLng);
    },

    initHUD() {
        const hud = document.createElement('div');
        hud.className = 'hud';
        hud.innerHTML = `
        <div class="crosshair">+</div>
        <div class="altitude">ALT: -- FT</div>
        <div class="speed">SPD: -- KTS</div>
        <div class="heading">HDG: ---°</div>
        <div class="coordinates">LAT: --.---- LON: ---.----</div>
        <div class="entity-count">ENTITIES: --</div>
        <div class="emitter-count">EMITTERS: --</div>
        <div class="emitter-types"></div>
        <div class="network-status">NETWORK: --</div>
        `;
        document.body.appendChild(hud);
        this.styleHUD();
    },

    initLayerControls() {
        const layerControl = L.control.layers({
            'Base Map': this.layers.base
        }, {
            'Entities': this.layers.entities,
            'Emitters': this.layers.emitters,
            'Markers': this.layers.markers,
            'Lines': this.layers.lines
        }).addTo(this.map);
    },

    startAnimation() {
        const animate = (timestamp) => {
            if (this.lastFrameTime === 0) {
                this.lastFrameTime = timestamp;
            }
            const deltaTime = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;

            this.updateHUD();
            this.animationFrame = requestAnimationFrame(animate);
        };
        this.animationFrame = requestAnimationFrame(animate);
    },

    calculateNewPosition(latLng, heading, distance) {
        const R = 6371; // Earth's radius in km
        const d = distance / 1000; // Convert to km
        const lat1 = this.degToRad(latLng.lat);
        const lon1 = this.degToRad(latLng.lng);
        const brng = this.degToRad(heading);

        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) +
                               Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
        const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
                                       Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));

        return L.latLng(this.radToDeg(lat2), this.radToDeg(lon2));
    },

    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    radToDeg(rad) {
        return rad * 180 / Math.PI;
    },

    updateEntityPosition(UID, latLng) {
        if (this.entityManager) {
            const latRad = this.degToRad(latLng.lat);
            const lngRad = this.degToRad(latLng.lng);
            this.entityManager.setEntityLatRadByUID(UID, latRad);
            this.entityManager.setEntityLongRadByUID(UID, lngRad);
        }
    },

    updateHUD() {
        const userLatLng = this.userMarker.getLatLng();
        document.querySelector('.coordinates').textContent = `LAT: ${userLatLng.lat.toFixed(4)} LON: ${userLatLng.lng.toFixed(4)}`;

        document.querySelector('.entity-count').textContent = `ENTITIES: ${this.entities.size}`;
        document.querySelector('.emitter-count').textContent = `EMITTERS: ${this.emitters.size}`;

        const emitterTypeCounts = Array.from(this.emitters.values()).reduce((acc, emitter) => {
            acc[emitter.type] = (acc[emitter.type] || 0) + 1;
            return acc;
        }, {});

        const emitterTypeText = Object.entries(emitterTypeCounts)
            .map(([type, count]) => `${type}: ${count}`)
            .join(' | ');

        document.querySelector('.emitter-types').textContent = emitterTypeText;

        // Assuming the first entity is the user's aircraft for demo purposes
        const userAircraft = this.entities.values().next().value;
        if (userAircraft) {
            document.querySelector('.altitude').textContent = `ALT: ${Math.round(userAircraft.altitude)} FT`;
            document.querySelector('.speed').textContent = `SPD: ${Math.round(userAircraft.speed * 3600 * 54)} KTS`; // Convert to knots
            document.querySelector('.heading').textContent = `HDG: ${Math.round(userAircraft.heading)}°`;
        }

        const networkStatus = this.networkWrapper && this.networkWrapper.isConnected ? 'CONNECTED' : 'DISCONNECTED';
        document.querySelector('.network-status').textContent = `NETWORK: ${networkStatus}`;
    },

    styleHUD() {
        const style = document.createElement('style');
        style.textContent = `
        .hud {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            font-family: monospace;
            color: #00ff00;
            text-shadow: 0 0 5px #00ff00;
            z-index: 10000;
        }
        .crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 40px;
        }
        .altitude, .speed, .heading, .coordinates, .entity-count, .emitter-count, .network-status {
            position: absolute;
            padding: 5px;
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
        }
        .altitude { bottom: 20px; left: 20px; }
        .speed { bottom: 20px; right: 20px; }
        .heading { top: 20px; left: 50%; transform: translateX(-50%); }
        .coordinates { top: 20px; left: 20px; }
        .entity-count { top: 170px; right: 20px; }
        .emitter-count { top: 200px; right: 20px; }
        .network-status { bottom: 20px; left: 50%; transform: translateX(-50%); }
        .emitter-types {
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            padding: 5px;
        }
        `;
        document.head.appendChild(style);
    },

    log(message) {
        if (this.entityManager) {
            this.entityManager.qmlLog(`JS: ${message}`);
        }
        console.log(message);
    }
};

window.onload = () => MapApp.init().catch(error => console.error('Initialisation error:', error));

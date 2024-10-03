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
    networkWrapper: null,
    userMarkerAnimationFrame: null,
    networkRetryInterval: null,
    networkRetryCount: 0,
    maxNetworkRetries: 5,

    // FIXME: Junk test data, remove
    emitterData: [
    ],

    async init() {
        this.initMap();
        await this.initWebChannel();
        await this.initNetworkInterface();
        await this.initEntities();
        this.bindEvents();
        this.startAnimation();
        this.initHUD();
        this.initLayerControls();
        this.startNetworkPolling();
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
                    this.networkWrapper.initialise("localhost", 8080);
                    resolve();
                } else {
                    reject(new Error('Failed to initialise entityManager or networkWrapper'));
                }
            });
        });
    },

    async initNetworkInterface() {
        if (!this.networkWrapper) {
            console.error('NetworkWrapper not initialized');
            return;
        }

        try {
            await this.networkWrapper.initialise("localhost", 8080);
            console.log('Network interface initialized');
            this.networkRetryCount = 0;
            this.startNetworkPolling();
        } catch (error) {
            console.error('Failed to initialize network interface:', error);
            this.handleNetworkError();
        }
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

    handleNetworkError() {
        if (this.networkRetryCount < this.maxNetworkRetries) {
            this.networkRetryCount++;
            console.log(`Retrying network connection (${this.networkRetryCount}/${this.maxNetworkRetries})...`);
            this.networkRetryInterval = setTimeout(() => this.initNetworkInterface(), 5000);
        } else {
            console.error('Max network retries reached. Please check your connection and restart the application.');
        }
    },

    startNetworkPolling() {
        if (this.networkRetryInterval) {
            clearInterval(this.networkRetryInterval);
        }
        setInterval(() => {
            this.pollNetwork();
        }, 100);
    },

    async pollNetwork() {
        try {
            const pe = await this.receivePE();
            if (pe) {
                this.updateOrAddEntity(pe);
            }

            const emitter = await this.receiveEmitter();
            if (emitter) {
                this.updateOrAddEmitter(emitter);
            }
        } catch (error) {
            console.error('Error polling network:', error);
            this.handleNetworkError();
        }
    },

    async receivePE() {
        return new Promise((resolve, reject) => {
            this.networkWrapper.receivePE(pe => {
                if (pe && typeof pe === 'object' && 'lat' in pe && 'lon' in pe) {
                    resolve(pe);
                } else {
                    reject(new Error('Invalid PE data received'));
                }
            });
        });
    },

    async receiveEmitter() {
        return new Promise((resolve, reject) => {
            this.networkWrapper.receiveEmitter(emitter => {
                resolve(emitter);
            });
        });
    },

    updateOrAddEntity(pe) {
            const entity = this.entities.get(pe.id);
            const newLatLng = L.latLng(pe.lat, pe.lon);

            if (entity) {
                // Update existing entity
                entity.targetLatLng = newLatLng;
                entity.heading = pe.heading;
                entity.speed = pe.speed;
                entity.altitude = pe.altitude;

                if (!entity.animating) {
                    this.animateEntityMovement(entity);
                }
            } else {
                // Add new entity
                const marker = this.createEntityMarker(newLatLng).addTo(this.layers.entities);
                const circle = L.circle(newLatLng, {
                    color: 'white',
                    weight: 1,
                    fillColor: 'white',
                    fillOpacity: 0.1,
                    radius: 2000
                }).addTo(this.layers.entities);

                this.entities.set(pe.id, {
                    marker,
                    circle,
                    latLng: newLatLng,
                    targetLatLng: newLatLng,
                    heading: pe.heading,
                    speed: pe.speed,
                    altitude: pe.altitude,
                    animating: false
                });
            }

            this.updateHUD();
        },

    updateOrAddEmitter(emitter) {
        const existingEmitter = this.emitters.get(emitter.id);
        const newLatLng = L.latLng(emitter.lat, emitter.lon);

        if (existingEmitter) {
            // Update existing emitter
            existingEmitter.marker.setLatLng(newLatLng);
            existingEmitter.circle.setLatLng(newLatLng);
        } else {
            // Add new emitter
            const marker = this.createEmitterMarker(newLatLng, emitter.category).addTo(this.layers.emitters);
            const circle = L.circle(newLatLng, {
                color: this.getEmitterColor(emitter.category),
                weight: 1,
                fillColor: this.getEmitterColor(emitter.category),
                fillOpacity: 0.1,
                radius: this.getEmitterRadius(emitter.category)
            }).addTo(this.layers.emitters);

            this.emitters.set(emitter.id, {
                marker,
                circle,
                latLng: newLatLng,
                type: emitter.category
            });
        }

        this.updateHUD();
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
        let deltaLat = 0;
        let deltaLng = 0;

        switch(event.key) {
            case 'ArrowUp': deltaLat = step; break;
            case 'ArrowDown': deltaLat = -step; break;
            case 'ArrowLeft': deltaLng = -step; break;
            case 'ArrowRight': deltaLng = step; break;
            default: return; // Exit if it's not an arrow key
        }

        this.moveUserMarker(deltaLat, deltaLng);
    },

    moveUserMarker(deltaLat, deltaLng) {
        const currentLatLng = this.userMarker.getLatLng();
        const newLat = currentLatLng.lat + deltaLat;
        const newLng = currentLatLng.lng + deltaLng;
        const newLatLng = L.latLng(newLat, newLng);

        this.updateUserPosition(newLatLng);
    },

    updateUserPosition(latLng) {
        this.userMarker.setLatLng(latLng);
        this.userRing.setLatLng(latLng);
        if (this.autoCentreOnPlane) {
            this.map.setView(latLng);
        }
        this.updateHUD();
    },

    // animateEntityMovement(entity) {
    //     entity.animating = true;
    //     const animate = () => {
    //         const currentLatLng = entity.marker.getLatLng();
    //         const targetLatLng = entity.targetLatLng;

    //         if (currentLatLng.equals(targetLatLng)) {
    //             entity.animating = false;
    //             return;
    //         }

    //         const newLat = currentLatLng.lat + (targetLatLng.lat - currentLatLng.lat) * 0.1;
    //         const newLng = currentLatLng.lng + (targetLatLng.lng - currentLatLng.lng) * 0.1;
    //         const newLatLng = L.latLng(newLat, newLng);

    //         entity.marker.setLatLng(newLatLng);
    //         entity.circle.setLatLng(newLatLng);

    //         // Update marker rotation based on heading
    //         const markerElement = entity.marker.getElement();
    //         if (markerElement) {
    //             markerElement.style.transform = `${markerElement.style.transform} rotate(${entity.heading}deg)`;
    //         }

    //         requestAnimationFrame(animate);
    //     };

    //     requestAnimationFrame(animate);
    // },

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

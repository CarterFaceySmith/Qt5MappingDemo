import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.10
import QtWebChannel 1.15
import QtQuick.Window 2.14

Window {
    visible: true
    width: 1024
    height: 800
    title: "Qt6 WebChannel JavaScript/C++ Map Demo"

    WebEngineView {
        id: webView
        anchors.fill: parent
        url: "qrc:///map.html"

        WebChannel {
            id: channel
            registeredObjects: [entityManagerObject, networkImplementationObject]
        }

        webChannel: channel
    }

    // Expose EntityManager to the JavaScript
    QtObject {
        id: entityManagerObject
        WebChannel.id: "entityManager"

        /* GETTERS */
        function getEntityByUID(UID) { if (entityManager) return entityManager.getEntityByUID(UID) }
        function getEntityLongRadByUID(UID) { if (entityManager) return  entityManager.getEntityByUID(UID).longitudeRadians }
        function getEntityLatRadByUID(UID) { if (entityManager) return entityManager.getEntityByUID(UID).latitudeRadians }
        function getEntityLongDegByUID(UID) { if (entityManager) return entityManager.getEntityByUID(UID).returnLongAsDeg() }
        function getEntityLatDegByUID(UID) { if (entityManager) return entityManager.getEntityByUID(UID).returnLatAsDeg() }

        /* SETTERS */
        function setEntityUID(currUID, newUID) { if (entityManager) entityManager.getEntityByUID(currUID).setUID(newUID) }
        function setEntityLongRadByUID(UID, lng) { if (entityManager)  entityManager.getEntityByUID(UID).setLongitudeRadians(lng) }
        function setEntityLatRadByUID(UID, lat) { if (entityManager) entityManager.getEntityByUID(UID).setLatitudeRadians(lat) }

        /* MISC. */
        function logMessage(message) { if (entityManager) entityManager.logMessage(message) }
        function qmlLog(msg) { console.debug(msg) }

        function createEntity(name, UID, radius, latitude, longitude) { if (entityManager) return entityManager.createEntity(name, UID, radius, latitude, longitude) }

        function printAllEntities() { if (entityManager) entityManager.printAllEntities() }

        function getEntityList() {
            var result = [];
            if (entityManager) {
                result = entityManager.getEntityList();
                console.log("QML: Received C++ entity list of length: " + result.entities.length);
                result = result.entities;
            }
            return result;
        }
    }

    // Expose NetworkImplementation to the JavaScript
    QtObject {
        id: networkImplementationObject
        WebChannel.id: "networkImplementation"

        // Initialization and connection
        function initialise(address, port) {
            if (networkImplementation) networkImplementation.initialise(address, port)
        }
        function close() {
            if (networkImplementation) networkImplementation.close()
        }

        // Sending methods
        function sendPESetting(setting, id, updateVal) {
            if (networkImplementation) return networkImplementation.sendPESetting(setting, id, updateVal)
        }
        function sendEmitterSetting(setting, id, updateVal) {
            if (networkImplementation) return networkImplementation.sendEmitterSetting(setting, id, updateVal)
        }
        function sendBlob(blobString) {
            if (networkImplementation) return networkImplementation.sendBlob(blobString)
        }
        function sendPE(pe) {
            if (networkImplementation) return networkImplementation.sendPE(pe)
        }
        function sendEmitter(emitter) {
            if (networkImplementation) return networkImplementation.sendEmitter(emitter)
        }
        function sendComplexBlob(pe, emitter, doubleMap) {
            if (networkImplementation) return networkImplementation.sendComplexBlob(pe, emitter, doubleMap)
        }

        // Receiving methods
        function receiveSetting() {
            if (networkImplementation) return networkImplementation.receiveSetting()
        }
        function receivePE() {
            if (networkImplementation) return networkImplementation.receivePE()
        }
        function receiveEmitter() {
            if (networkImplementation) return networkImplementation.receiveEmitter()
        }
        function receiveBlob() {
            if (networkImplementation) return networkImplementation.receiveBlob()
        }
        function receiveComplexBlob() {
            if (networkImplementation) return networkImplementation.receiveComplexBlob()
        }

        // Logging
        function log(message) {
            if (networkImplementation) networkImplementation.log(message)
        }
    }
}


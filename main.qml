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
            registeredObjects: [entityManagerObject, networkWrapperObject]
        }

        webChannel: channel
    }

    // Expose EntityManager to the JavaScript
    QtObject {
        id: entityManagerObject
        WebChannel.id: "entityManager"

        /* Getting */
        function getEntityByUID(UID) { if (entityManager) return entityManager.getEntityByUID(UID) }
        function getEntityLongRadByUID(UID) { if (entityManager) return  entityManager.getEntityByUID(UID).longitudeRadians }
        function getEntityLatRadByUID(UID) { if (entityManager) return entityManager.getEntityByUID(UID).latitudeRadians }
        function getEntityLongDegByUID(UID) { if (entityManager) return entityManager.getEntityByUID(UID).returnLongAsDeg() }
        function getEntityLatDegByUID(UID) { if (entityManager) return entityManager.getEntityByUID(UID).returnLatAsDeg() }

        /* Setting */
        function setEntityUID(currUID, newUID) { if (entityManager) entityManager.getEntityByUID(currUID).setUID(newUID) }
        //FIXME: Unknown return type Entity* on both below setters
        function setEntityLongRadByUID(UID, lng) { if (entityManager)  entityManager.getEntityByUID(UID).setLongitudeRadians(lng) }
        function setEntityLatRadByUID(UID, lat) { if (entityManager) entityManager.getEntityByUID(UID).setLatitudeRadians(lat) }

        /* Errors and logging. */
        function logMessage(message) { if (entityManager) entityManager.logMessage(message) }
        function qmlLog(msg) { console.debug(msg) }

        /* Entity helpers */
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

    // Expose NetworkInterfaceWrapper to the JavaScript
    QtObject {
        id: networkWrapperObject
        WebChannel.id: "networkWrapper"

        /* Initialisation and connection */
        function initialise(address, port) {
            if (networkWrapper) networkWrapper.initialise(address, port)
        }
        function close() {
            if (networkWrapper) networkWrapper.close()
        }

        /* Sending */
        function sendPESetting(setting, id, updateVal) {
            if (networkWrapper) return networkWrapper.sendPESetting(setting, id, updateVal)
        }
        function sendEmitterSetting(setting, id, updateVal) {
            if (networkWrapper) return networkWrapper.sendEmitterSetting(setting, id, updateVal)
        }
        function sendBlob(blobString) {
            if (networkWrapper) return networkWrapper.sendBlob(blobString)
        }
        function sendPE(pe) {
            if (networkWrapper) return networkWrapper.sendPE(pe)
        }
        function sendEmitter(emitter) {
            if (networkWrapper) return networkWrapper.sendEmitter(emitter)
        }
        function sendComplexBlob(pe, emitter, doubleMap) {
            if (networkWrapper) return networkWrapper.sendComplexBlob(pe, emitter, doubleMap)
        }

        /* Receiving */
        function receiveSetting() {
            if (networkWrapper) return networkWrapper.receiveSetting()
        }
        function receivePE() {
            if (networkWrapper) return networkWrapper.receivePE()
        }
        function receiveEmitter() {
            if (networkWrapper) return networkWrapper.receiveEmitter()
        }
        function receiveBlob() {
            if (networkWrapper) return networkWrapper.receiveBlob()
        }
        function receiveComplexBlob() {
            if (networkWrapper) return networkWrapper.receiveComplexBlob()
        }
    }

    /* Error handling */
    Connections {
        target: networkWrapper
        function onError(message) {
            console.error("Network error:", message)
        }
    }
}

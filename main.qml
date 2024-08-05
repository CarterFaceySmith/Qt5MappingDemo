import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.10
import QtWebChannel 1.15
import QtQuick.Window 2.14
import "qrc:///mapScript.js" as MapScript

Window {
    visible: true
    width: 1024
    height: 800
    title: "Qt5 WebChannel JavaScript/C++ Map Demo"

    WebEngineView {
        id: webView
        anchors.fill: parent
        url: "qrc:///map.html"

        WebChannel {
            id: channel
            registeredObjects: [entityManagerObject]
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
        function setEntityUID(currUID, newUID) { if (entityManager) entityManager.getEntityByUID(currUID).setUID(currUID, newUID) }
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
}


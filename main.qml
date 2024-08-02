import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.15
import QtWebChannel 1.15
import QtQuick.Window 2.14

Window {
    visible: true
    width: 1024
    height: 800
    title: "Qt5 WebChannel JavaScript/C++ Map Demo"

    WebEngineView {
        id: webView
        anchors.fill: parent
        url: "qrc:///map.html"

        // FIXME: Temporary removal for build debugging
        // onLoadingChanged: {
        //     if (loadRequest.status === WebEngineLoadRequest.LoadSucceededStatus) {
        //         console.log("QML WebEngine loaded successfully.")
        //     } else {
        //         console.log("QML WebEngine failed to load.")
        //     }
        // }

        // Set up the WebChannel and register objects
        WebChannel {
            id: channel
            registeredObjects: [entityManagerObject]
        }

        webChannel: channel
    }

    /* Developer Note:
       This is annoying, it seems like you shouldn't have to write these wrapper functions to expose internal C++
       functions to JS, since the exposure of the C++ class to the QML application should do that anyway.
       Maybe I'm an idiot, maybe it's a syntax error, not sure.

       Current thinking is to have the entityManager handle being in here with defined interface functions, and
       only interact with entities by way of the manager.
       E.g. JS calls entityManager.em_GetEntityByUUID("UID001").<Some entity internal C++ function>
    */
    // Expose EntityManager to the JavaScript
    QtObject {
        id: entityManagerObject
        WebChannel.id: "entityManager"

        function createEntity(name, UID, radius, latitude, longitude) {
            return entityManager.createEntity(name, UID, radius, latitude, longitude);
        }

        function printAllEntities(){
            entityManager.printAllEntities();
        }

        function getEntityByUID(UID) {
            return entityManager.getEntityByUID(UID);
        }

        function updateEntityId(currentId, newId) {
            entityManager.updateEntityId(currentId, newId);
        }

        function logMessage(message) {
            entityManager.logMessage(message);
        }

        function getEntityList() {
            var entities = entityManager.getEntityList();
            var entityModel = [];

            for (var i = 0; i < entities.length; ++i) {
                var entity = entities[i];
                entityModel.push({
                    name: entity.name,
                    UID: entity.UID,
                    radius: entity.radius,
                    latitude: entity.latitude,
                    longitude: entity.longitude
                });
            }
            // return entityModel;
            return entities;
        }

    }

    // QtObject {
    //     id: entityQt
    //     WebChannel.id: "entityQt"

    //     // Interface Functions - To be called from JS
    //     function e_TransportMessage(message) { entity.logMessage("Forwarded from HTML to Entity: " + message) }
    //     function e_radius() { console.log("Entity returned a radius of: " + entity.radius) }
    // }
}

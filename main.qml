import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.10
import QtWebChannel 1.0
import QtQuick.Window 2.14

Window {
    visible: true
    width: 800
    height: 600
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
            registeredObjects: [entityManagerQt, entityQt]
        }

        webChannel: channel
    }

    QtObject {
        id: entityManagerQt
        WebChannel.id: "entityManagerQt"

        // Interface Functions - To be called from JS
        function em_TransportMessage(message) { entityManager.logMessage("Forwarded from HTML to Entity Manager: " + message); }
    }

    QtObject {
        id: entityQt
        WebChannel.id: "entityQt"

        // Interface Functions - To be called from JS
        function e_TransportMessage(message) { entity.logMessage("Forwarded from HTML to Entity: " + message) }
        function e_radius() { console.log("Entity returned a radius of: " + entity.radius) }
    }
}

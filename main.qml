import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.10
import QtWebChannel 1.0
import QtQuick.Window 2.14

Window {
    visible: true
    width: 800
    height: 600
    title: "Qt5 WebChannel Mapping Demo"

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
            registeredObjects: [backend/*, entityManager, entity*/]
        }

        webChannel: channel
    }

    // QtObject {
    //     id: entityManager
    //     WebChannel.id: "entityManager"

    //     // Functions to be called from JS
    //     // function showAlert(message) {
    //     //     console.log("Received message from HTML: " + message);
    //     //     entityManagerBackend.logMessageEM("Forwarded from HTML to EM: " + message);  // Call method in entity manager
    //     // }
    // }

    // QtObject {
    //     id: entity
    //     WebChannel.id: "entity"
    // }

    QtObject {
        id: backend
        WebChannel.id: "backend"

        function transportMessage(target, message) {
            console.log("Received message from HTML: " + message);
            if(target === "entity"){
                console.log("Entity message received");
            } else if (target === "entityManager") {
                console.log("EM message received");
                entityManager.logMessageEM("Forwarded from HTML to EM: " + message);
            } else{
                console.log("Unknown target message received");
            }

        }

        // function logMessageEM(message) { entityManager.logMessageEM(messsage); }
    }
}

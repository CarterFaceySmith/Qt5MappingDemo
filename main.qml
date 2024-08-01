import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.10
import QtWebChannel 1.0
import QtQuick.Window 2.14

Window {
    visible: true
    width: 800
    height: 600
    title: "Simple Map Demo"

    WebEngineView {
        id: webView
        anchors.fill: parent
        url: "qrc:///map.html"

        // onLoadingChanged: {
        //     if (loadRequest.status === WebEngineLoadRequest.LoadSucceededStatus) {
        //         console.log("Loading successful!")
        //     } else {
        //         console.log("Loading failed!")
        //     }
        // }

        // Set up the WebChannel and register objects
        WebChannel {
            id: channel
            registeredObjects: [backend]
        }

        webChannel: channel
    }

    QtObject {
        id: backend
        WebChannel.id: "backend"

        // Function to be called from JS
        function showAlert(message) {
            console.log("Received message from HTML: " + message);
            myEntity.logMessage("Forwarded from HTML to Entity: " + message);  // Call method in entity
            myEntityManager.logMessage("Forwarded from HTML to EM: " + message);  // Call method in entity manager
        }
    }
}

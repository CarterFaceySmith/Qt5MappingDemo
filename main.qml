import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.15
import QtWebChannel 1.15
import QtQuick.Window 2.14

Window {
    visible: true
    width: 1024
    height: 768
    title: "Qt5 WebChannel Mapping Demo"

    WebEngineView {
        id: webView
        anchors.fill: parent
        url: "qrc:///map.html"

        onLoadingChanged: {
            if (loadRequest.status === WebEngineLoadRequest.LoadSucceededStatus) {
                console.log("Loading successful!")
            } else {
                console.log("Loading failed!")
            }
        }

        //The web-channel is the middleware between HTML and QML
        webChannel: channel
        WebChannel {
            id: channel
            registeredObjects: [webExchange]
        }

        //This object acts as the interface object between the QML and HTML/Javascript world.
        //The webExchange object is exposted within the HTML/js world as "webExchange" and
        //can be interacted with exactly as if it were a javascript object local to that
        //web page.
        QtObject {
            id: webExchange
            WebChannel.id: "webExchange"


            // ---[ Custom Properties & Values ]--------------------------------------
            //Properties that will be visible to both HTML/Javascriptland and QMLworld
            property bool qmlButtonPressed:    qmlButton.down //We're binding this to the button's "down" property
            onQmlButtonPressedChanged: {
                if (qmlButtonPressed) {
                    pressQmlButton();
                } else {
                    releaseQmlButton();
                }
            }

            // ---[ Custom Signals & Functions ]--------------------------------------
            //Functions/signals invoked by QML to invoke functions in HTML/Javascriptland
            signal pressQmlButton;
            signal releaseQmlButton;


            /*! This function will be invoked from over in HTML/Javascriptland. */
            function printText(message) {
                console.log("HTML RETURNED: [" + message + "]");
                textBox.text = message;
                opacityAnimation.start();
            }
        }
    }
}

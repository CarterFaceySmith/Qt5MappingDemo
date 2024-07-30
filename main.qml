import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.15
import QtWebChannel 1.15

ApplicationWindow {
    visible: true
    width: 800
    height: 600
    title: "Qt WebChannel Example"

    WebEngineView {
        id: webView
        anchors.fill: parent
        url: "qrc:/map.html"

        onLoadProgressChanged: {
            // Setup WebChannel once the page is loaded
            webView.runJavaScript("initializeWebChannel();");
        }
    }

    // Add other QML components as needed
}

import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.15
import QtWebChannel 1.15

ApplicationWindow {
    visible: true
    width: 1024
    height: 768
    title: "Qt5 WebChannel Mapping Demo"

    WebEngineView {
        id: webView
        anchors.fill: parent
        url: "qrc:/map.html"

        onLoadProgressChanged: {
            // Setup WebChannel once the page is loaded
            webView.runJavaScript("initialiseWebChannel();");
        }
    }

    // Add other QML components as needed
}

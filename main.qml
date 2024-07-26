import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.15

ApplicationWindow {
    visible: true
    width: 1024
    height: 768
    title: "Interactive Map"

    WebEngineView {
        id: webview
        anchors.fill: parent
        url: "qrc:/map.html"
    }
}

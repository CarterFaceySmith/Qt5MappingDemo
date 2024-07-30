import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.15

ApplicationWindow {
    visible: true
    width: 800
    height: 600
    title: "Qt 5 Mapping Demo"

    // WebEngineView to display HTML content
    WebEngineView {
        id: webView
        anchors.fill: parent
        url: "qrc:/map.html"
    }

    QtObject {
        id: qtObject
        signal updateEntityId(int newId)

        onUpdateEntityId: {
            console.log("Entity ID updated from JS:", newId);
        }
    }

    // Button to trigger the JS func
    Button {
        text: "Update ID from JS"
        onClicked: {
            webView.runJavaScript("updateEntityId(100);");
        }
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
    }
}

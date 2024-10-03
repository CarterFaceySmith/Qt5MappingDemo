import QtQuick 2.15
import QtQuick.Window 2.15
import QtLocation 5.15
import QtPositioning 5.15

Window {
    visible: true
    width: 1024
    height: 768
    title: "Military Aerospace Map"
    color: "black"

    Plugin {
        id: mapPlugin
        name: "osm"
        PluginParameter { name: "osm.mapping.custom.host"; value: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png" }
    }

    Map {
        id: map
        anchors.fill: parent
        plugin: mapPlugin
        center: QtPositioning.coordinate(-37.814, 144.963)
        zoomLevel: 10

        MapItemView {
            model: dataManager.entities
            delegate: MapQuickItem {
                coordinate: QtPositioning.coordinate(modelData.lat, modelData.lon)
                anchorPoint.x: entityItem.width/2
                anchorPoint.y: entityItem.height/2
                sourceItem: Item {
                    id: entityItem
                    width: 40
                    height: 40

                    Rectangle {
                        anchors.centerIn: parent
                        width: 20
                        height: 20
                        color: "transparent"
                        border.color: "white"
                        border.width: 2
                        transform: Rotation { origin.x: 10; origin.y: 10; angle: modelData.heading }
                    }

                    Text {
                        anchors.top: parent.bottom
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: modelData.id
                        color: "white"
                        font.pixelSize: 10
                    }
                }
            }
        }

        MapItemView {
            model: dataManager.entities
            delegate: MapQuickItem {
                coordinate: QtPositioning.coordinate(modelData.lat, modelData.lon)
                anchorPoint.x: entityCircle.width/2
                anchorPoint.y: entityCircle.height/2
                sourceItem: Rectangle {
                    id: entityCircle
                    width: 2000  // Adjust this value based on your needs
                    height: width
                    radius: width/2
                    color: "transparent"
                    border.color: "white"
                    border.width: 1
                    opacity: 0.5
                }
            }
        }

        MapItemView {
            model: dataManager.emitters
            delegate: MapQuickItem {
                coordinate: QtPositioning.coordinate(modelData.lat, modelData.lon)
                anchorPoint.x: emitterItem.width/2
                anchorPoint.y: emitterItem.height/2
                sourceItem: Item {
                    id: emitterItem
                    width: 24
                    height: 24

                    Rectangle {
                        anchors.fill: parent
                        color: "transparent"
                        border.color: modelData.category === "RADAR" ? "#FF0000" :
                                      modelData.category === "RADIO" ? "#00FF00" : "#FFFF00"
                        border.width: 2
                    }

                    Text {
                        anchors.centerIn: parent
                        text: modelData.category[0]
                        color: modelData.category === "RADAR" ? "#FF0000" :
                               modelData.category === "RADIO" ? "#00FF00" : "#FFFF00"
                        font.pixelSize: 12
                        font.bold: true
                    }
                }
            }
        }

        MapItemView {
            model: dataManager.emitters
            delegate: MapQuickItem {
                coordinate: QtPositioning.coordinate(modelData.lat, modelData.lon)
                anchorPoint.x: emitterCircle.width/2
                anchorPoint.y: emitterCircle.height/2
                sourceItem: Rectangle {
                    id: emitterCircle
                    width: modelData.category === "RADAR" ? 7000 :
                           modelData.category === "RADIO" ? 5000 : 3000
                    height: width
                    radius: width/2
                    color: "transparent"
                    border.color: modelData.category === "RADAR" ? "#FF0000" :
                                  modelData.category === "RADIO" ? "#00FF00" : "#FFFF00"
                    border.width: 1
                    opacity: 0.5
                }
            }
        }
    }

    // HUD (Heads-Up Display)
    Item {
        id: hud
        anchors.fill: parent

        Text {
            id: coordinates
            anchors.top: parent.top
            anchors.left: parent.left
            anchors.margins: 10
            color: "#00FF00"
            font.pixelSize: 14
            text: "LAT: " + map.center.latitude.toFixed(4) + " LON: " + map.center.longitude.toFixed(4)
            font.family: "Monospace"
        }

        Text {
            id: entityCount
            anchors.top: coordinates.bottom
            anchors.left: parent.left
            anchors.margins: 10
            color: "#00FF00"
            font.pixelSize: 14
            text: "ENTITIES: " + (dataManager.entities ? dataManager.entities.length : 0)
            font.family: "Monospace"
        }

        Text {
            id: emitterCount
            anchors.top: entityCount.bottom
            anchors.left: parent.left
            anchors.margins: 10
            color: "#00FF00"
            font.pixelSize: 14
            text: "EMITTERS: " + (dataManager.emitters ? dataManager.emitters.length : 0)
            font.family: "Monospace"
        }

        Text {
            id: networkStatus
            anchors.bottom: parent.bottom
            anchors.left: parent.left
            anchors.margins: 10
            color: "#00FF00"
            font.pixelSize: 14
            text: "NETWORK: " + (dataManager.isConnected ? "CONNECTED" : "DISCONNECTED")
            font.family: "Monospace"
        }

        // Crosshair
        Item {
            anchors.centerIn: parent
            width: 20
            height: 20

            Rectangle {
                anchors.centerIn: parent
                width: 20
                height: 2
                color: "#00FF00"
            }

            Rectangle {
                anchors.centerIn: parent
                width: 2
                height: 20
                color: "#00FF00"
            }
        }
    }

    // Key handler for moving the map
    Item {
        anchors.fill: parent
        focus: true
        Keys.onPressed: function(event) {
            var pan = 0.001 // Adjust this value to change the pan speed
            switch(event.key) {
                case Qt.Key_Up:
                    map.pan(0, -pan * map.height)
                    break
                case Qt.Key_Down:
                    map.pan(0, pan * map.height)
                    break
                case Qt.Key_Left:
                    map.pan(-pan * map.width, 0)
                    break
                case Qt.Key_Right:
                    map.pan(pan * map.width, 0)
                    break
            }
        }
    }
}

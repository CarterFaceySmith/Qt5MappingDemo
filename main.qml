import QtQuick 2.15
import QtQuick.Window 2.15
import QtLocation 5.6
import QtPositioning 5.6

Window {
    width: 640
    height: 480
    title: qsTr("Qt5 Mapping Demo")
    visible: true

    Plugin {
        id: osmPlugin
        name: "osm"
    }

    Map {
        id: map
        anchors.fill: parent
        plugin: osmPlugin
        center: QtPositioning.coordinate(-37.8140, 144.9632) // Melbourne
        zoomLevel: 12

        MapCircle {
            center: QtPositioning.coordinate(-37.8140, 144.9632) // Melbourne
            radius: 500 // meters
            color: "blue"
        }

        MapCircle {
            center: QtPositioning.coordinate(-37.8255, 144.9701) // Another location
            radius: 300 // meters
            color: "red"
        }

        MapCircle {
            center: QtPositioning.coordinate(-37.8053, 144.9578) // Another location
            radius: 700 // meters
            color: "green"
        }
    }
}

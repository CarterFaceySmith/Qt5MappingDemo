import QtQuick 2.15
import QtQuick.Window 2.15
import QtLocation 5.6
import QtPositioning 5.6
import QtQuick.Controls 2.15

Window {
    width: 640
    height: 480
    title: qsTr("Qt5 Mapping Demo")
    visible: true

    property var markers: []  // Array to hold marker coordinates
    property var lines: []    // Array to hold lines
    property bool isAddingMarker: false // Flag to indicate marker creation mode

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

        // Drawing lines between markers
        Repeater {
            model: lines
            MapPolyline {
                id: polyline
                path: line.path
                line.color: "black"
                width: 2
            }
        }

        // Drawing markers
        Repeater {
            model: markers
            MapQuickItem {
                id: markerItem
                coordinate: marker.coordinate
                anchorPoint.x: markerImage.width / 2
                anchorPoint.y: markerImage.height / 2
                sourceItem: Item {
                    width: 40
                    height: 40

                    // Background circle for better visibility
                    Rectangle {
                        width: 40
                        height: 40
                        radius: 20
                        color: "white"
                        border.color: "black"
                        border.width: 2
                        z: 0
                    }

                    // Marker image
                    Image {
                        id: markerImage
                        source: "marker.png"  // Path to marker image
                        width: 30
                        height: 30
                        anchors.centerIn: parent
                        z: 1
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        // Remove marker on click
                        markers = markers.filter(function(item) {
                            return item !== markerItem;
                        });
                        lines = lines.filter(function(line) {
                            return line.path.indexOf(marker.coordinate) === -1;
                        });
                    }
                }
            }
        }

        // Mouse area for panning
        MouseArea {
            id: mapMouseArea
            anchors.fill: parent
            drag.target: parent
            property var startCenter: map.center
            property var startPosition: Qt.point(0, 0)
            property real sensitivity: 0.15 // Sensitivity factor for panning

            onPressed: {
                startCenter = map.center
                startPosition = Qt.point(mouse.x, mouse.y)
                mapMouseArea.drag.hotSpot.x = mouse.x
                mapMouseArea.drag.hotSpot.y = mouse.y
            }

            onPositionChanged: {
                if (drag.active) {
                    var offset = Qt.point(mouse.x - startPosition.x, mouse.y - startPosition.y)
                    var scale = 1.0 / Math.pow(2, map.zoomLevel)
                    var latOffset = offset.y * (360.0 / Math.pow(2, map.zoomLevel)) / height * sensitivity
                    var lonOffset = offset.x * (360.0 / Math.pow(2, map.zoomLevel)) / width * sensitivity
                    map.center = QtPositioning.coordinate(startCenter.latitude + latOffset, startCenter.longitude - lonOffset)
                }
            }
        }

        // MouseArea for adding markers
        MouseArea {
            id: mapClickArea
            anchors.fill: parent
            onClicked: function(event) {
                if (isAddingMarker) {
                    // Place a new marker at the clicked location
                    var clickedCoordinate = map.toCoordinate(Qt.point(event.x, event.y));
                    markers.push({ coordinate: clickedCoordinate });

                    // Update lines if there are at least two markers
                    if (markers.length > 1) {
                        var lastMarker = markers[markers.length - 1];
                        var secondLastMarker = markers[markers.length - 2];
                        lines.push({ path: [secondLastMarker.coordinate, lastMarker.coordinate] });
                    }

                    // Exit marker creation mode
                    isAddingMarker = false;
                }
            }
        }
    }

    // Buttons for user interactions
    Button {
        text: "Add Marker"
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        onClicked: {
            // Enable marker creation mode
            isAddingMarker = true;
        }
    }

    Button {
        text: "Remove All Markers"
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.leftMargin: 100
        onClicked: {
            markers = [];
            lines = [];
        }
    }
}

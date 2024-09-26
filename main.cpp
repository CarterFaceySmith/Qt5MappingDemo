#include <QApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QtWebEngineWidgets>
#include <QUrl>
#include "EntityManager.h"
#include "AbstractNetworkInterface.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    QQmlApplicationEngine engine;

    NetworkImplementation networkImplementation;
    EntityManager entityManager;
    entityManager.createEntity("C", "CHARIOT", 1000, -37.814, 144.963);
    entityManager.createEntity("D", "HANGED", 1000, -37.714, 144.863);
    entityManager.createEntity("J", "JOKER", 1000, -37.914, 144.863);
    entityManager.createEntity("Devil1", "DVL001", 500, -37.804, 144.953);
    entityManager.createEntity("Devil2", "DVL002", 500, -37.714, 144.963);
    entityManager.createEntity("Devil3", "DVL003", 700, -37.914, 144.873);

    engine.rootContext()->setContextProperty("networkImplementation", &networkImplementation);
    engine.rootContext()->setContextProperty("entityManager", &entityManager);

    // Load the QML file
    engine.load(QUrl(QStringLiteral("qrc:/main.qml")));

    return app.exec();
}

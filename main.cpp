#include <QApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QtWebEngineWidgets>
#include <QUrl>
#include "EntityManager.h"
#include "NetworkInterfaceWrapper.h"
#include "AbstractNetworkInterface.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    QQmlApplicationEngine engine;

    EntityManager entityManager;
    entityManager.createEntity("C", "CHARIOT", 1000, -37.814, 144.963);
    entityManager.createEntity("D", "HANGED", 1000, -37.714, 144.863);
    entityManager.createEntity("J", "JOKER", 1000, -37.914, 144.863);
    entityManager.createEntity("Devil1", "DVL001", 500, -37.804, 144.953);
    entityManager.createEntity("Devil2", "DVL002", 500, -37.714, 144.963);
    entityManager.createEntity("Devil3", "DVL003", 700, -37.914, 144.873);

    auto networkInterface = std::make_unique<NetworkImplementation>();
    NetworkInterfaceWrapper networkWrapper(networkInterface.get());

    engine.rootContext()->setContextProperty("entityManager", &entityManager);
    engine.rootContext()->setContextProperty("networkWrapper", &networkWrapper);

    engine.load(QUrl(QStringLiteral("qrc:/main.qml")));

    if (engine.rootObjects().isEmpty())
        return -1;

    return app.exec();
}

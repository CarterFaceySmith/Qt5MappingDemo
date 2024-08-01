#include <QApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QtWebEngineWidgets>
#include <QUrl>
#include "Entity.h"
#include "EntityManager.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    QQmlApplicationEngine engine;

    // Create instances of the C++ classes
    Entity myEntity;
    EntityManager myEntityManager;

    // Expose the objects to QML
    engine.rootContext()->setContextProperty("myEntity", &myEntity);
    engine.rootContext()->setContextProperty("myEntityManager", &myEntityManager);

    // Load the QML file
    engine.load(QUrl(QStringLiteral("qrc:/main.qml")));

    return app.exec();
}

#include <QApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QtWebEngineWidgets>
#include <QUrl>
// #include "Entity.h"
#include "EntityManager.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    QQmlApplicationEngine engine;

    // Create instances of the C++ classes
    EntityManager entityManager;
    // Entity entity;
    entityManager.createEntity("Carter", "CHARIOT", 1000, -37.814, 144.963);
    entityManager.createEntity("Dan", "HANGED", 1000, -37.714, 144.863);
    entityManager.createEntity("Jordan", "JOKER", 1000, -37.914, 144.863);


    // Expose the objects to QML
    // qmlRegisterType<Entity>("Qt5MappingDemo", 1, 0, "Entity");
    engine.rootContext()->setContextProperty("entityManager", &entityManager);

    // Load the QML file
    engine.load(QUrl(QStringLiteral("qrc:/main.qml")));

    return app.exec();
}

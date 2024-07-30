#include <QApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QUrl>
#include "Entity.h"
#include "EntityManager.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);

    QQmlApplicationEngine engine;

    qmlRegisterType<Entity>("Qt5MappingDemo", 1, 0, "Entity");
    qmlRegisterType<EntityManager>("Qt5MappingDemo", 1, 0, "EntityManager");

    EntityManager entityManager;

    engine.rootContext()->setContextProperty("EntityManager", &entityManager);

    const QUrl url(QStringLiteral("qrc:/main.qml"));
    engine.load(url);

    if (engine.rootObjects().isEmpty())
        return -1;

    return app.exec();
}

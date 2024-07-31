#include <QApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QtWebEngineWidgets>
#include <QUrl>
#include "Entity.h"
#include "EntityManager.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);

    // Create and configure the WebChannel
    QWebChannel *webChannel = new QWebChannel;

    // Create the WebEngineView but do not show it directly
    QWebEngineView *view = new QWebEngineView;
    view->page()->setWebChannel(webChannel);
    view->setUrl(QUrl("qrc:/map.html"));

    QQmlApplicationEngine engine;
    EntityManager entityManager;
    Entity entity;

    // Register WebChannel and objects for QML
    webChannel->registerObject("EntityManager", &entityManager);
    webChannel->registerObject("Entity", &entity);
    engine.rootContext()->setContextProperty("webView", view);

    // Load the QML file
    engine.load(QUrl(QStringLiteral("qrc:///main.qml")));

    // Check if the QML file loaded successfully
    if (engine.rootObjects().isEmpty())
        return -1;

    // Execute the application
    return app.exec();
}

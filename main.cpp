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

    // Create and configure the WebEngineView
    QWebEngineView *view = new QWebEngineView;
    view->page()->setWebChannel(webChannel);
    view->setUrl(QUrl("qrc:/map.html"));
    view->show();

    QQmlApplicationEngine engine;
    EntityManager entityManager;


    // auto m_pView = new QWebEngineView(this);
    // QWebChannel * channel = new QWebChannel(page);
    // m_pView->page()->setWebChannel(channel);
    // channel->registerObject(QString("entity"), this);

    webChannel->registerObject("EntityManager", &entityManager);


    qmlRegisterType<Entity>("Qt5MappingDemo", 1, 0, "Entity");
    qmlRegisterType<EntityManager>("Qt5MappingDemo", 1, 0, "EntityManager");


    engine.rootContext()->setContextProperty("EntityManager", &entityManager);

    const QUrl url(QStringLiteral("qrc:///main.qml"));
    engine.load(url);

    if (engine.rootObjects().isEmpty())
        return -1;

    return app.exec();
}

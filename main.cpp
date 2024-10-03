#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include "DataManager.h"
#include "AbstractNetworkInterface.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    QQmlApplicationEngine engine;

    auto networkInterface = std::make_unique<NetworkImplementation>();
    DataManager dataManager(networkInterface.get());

    engine.rootContext()->setContextProperty("dataManager", &dataManager);

    const QUrl url(QStringLiteral("qrc:/main.qml"));
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [url](QObject *obj, const QUrl &objUrl) {
        if (!obj && url == objUrl)
            QCoreApplication::exit(-1);
    }, Qt::QueuedConnection);
    engine.load(url);

    // Initialize network connection
    dataManager.initialize("127.0.0.1", 5461);

    return app.exec();
}

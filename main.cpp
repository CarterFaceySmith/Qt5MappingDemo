#include <QApplication>
#include <QMainWindow>
#include <QWebEngineView>
#include <QQmlApplicationEngine>
#include <QUrl>

int main(int argc, char *argv[]) {
    QApplication app(argc, argv);

    // QMainWindow mainWindow;
    // QWebEngineView *webView = new QWebEngineView;

    // // Load the HTML file from resources
    // webView->setUrl(QUrl("qrc:/map.html"));

    // mainWindow.setCentralWidget(webView);
    // mainWindow.resize(800, 600);
    // mainWindow.show();

    QQmlApplicationEngine engine;
    const QUrl url(QStringLiteral("qrc:/main.qml"));
    engine.load(url);

    if (engine.rootObjects().isEmpty())
        return -1;


    return app.exec();
}

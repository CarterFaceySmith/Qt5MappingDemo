#ifndef DATAMANAGER_H
#define DATAMANAGER_H

#include <QObject>
#include <QTimer>
#include <QVariantList>
#include "AbstractNetworkInterface.h"

class DataManager : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QVariantList entities READ entities NOTIFY entitiesChanged)
    Q_PROPERTY(QVariantList emitters READ emitters NOTIFY emittersChanged)
    Q_PROPERTY(bool isConnected READ isConnected NOTIFY isConnectedChanged)

public:
    explicit DataManager(AbstractNetworkInterface* interface, QObject *parent = nullptr);

    QVariantList entities() const;
    QVariantList emitters() const;
    bool isConnected() const;

public slots:
    void initialize(const QString& address, int port);
    void pollNetwork();

signals:
    void entitiesChanged();
    void emittersChanged();
    void isConnectedChanged();

private:
    AbstractNetworkInterface* m_interface;
    QVariantList m_entities;
    QVariantList m_emitters;
    QTimer m_pollTimer;

    void updateOrAddEntity(const PE& pe);
    void updateOrAddEmitter(const Emitter& emitter);
};

#endif // DATAMANAGER_H

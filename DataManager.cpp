#include "DataManager.h"
#include <QDebug>

DataManager::DataManager(AbstractNetworkInterface* interface, QObject *parent)
    : QObject(parent), m_interface(interface)
{
    connect(&m_pollTimer, &QTimer::timeout, this, &DataManager::pollNetwork);
    m_pollTimer.setInterval(100);  // Poll every 100ms
}

QVariantList DataManager::entities() const
{
    return m_entities;
}

QVariantList DataManager::emitters() const
{
    return m_emitters;
}

bool DataManager::isConnected() const
{
    return m_interface->isConnected();
}

void DataManager::initialize(const QString& address, int port)
{
    try {
        m_interface->initialize(address.toStdString(), static_cast<unsigned short>(port));
        m_pollTimer.start();
        emit isConnectedChanged();
    } catch (const std::exception& e) {
        qDebug() << "Failed to initialize network:" << e.what();
    }
}

void DataManager::pollNetwork()
{
    if (!isConnected()) {
        return;
    }

    try {
        PE pe = m_interface->receivePE();
        updateOrAddEntity(pe);

        Emitter emitter = m_interface->receiveEmitter();
        updateOrAddEmitter(emitter);
    } catch (const std::exception& e) {
        qDebug() << "Error polling network:" << e.what();
        emit isConnectedChanged();
    }
}

void DataManager::updateOrAddEntity(const PE& pe)
{
    for (int i = 0; i < m_entities.size(); ++i) {
        QVariantMap entity = m_entities[i].toMap();
        if (entity["id"] == QString::fromStdString(pe.id.toStdString())) {
            entity["lat"] = pe.lat;
            entity["lon"] = pe.lon;
            entity["altitude"] = pe.altitude;
            entity["heading"] = pe.heading;
            m_entities[i] = entity;
            emit entitiesChanged();
            return;
        }
    }

    QVariantMap newEntity;
    newEntity["id"] = QString::fromStdString(pe.id.toStdString());
    newEntity["type"] = QString::fromStdString(pe.type.toStdString());
    newEntity["lat"] = pe.lat;
    newEntity["lon"] = pe.lon;
    newEntity["altitude"] = pe.altitude;
    newEntity["heading"] = pe.heading;
    m_entities.append(newEntity);
    emit entitiesChanged();
}

void DataManager::updateOrAddEmitter(const Emitter& emitter)
{
    for (int i = 0; i < m_emitters.size(); ++i) {
        QVariantMap em = m_emitters[i].toMap();
        if (em["id"] == QString::fromStdString(emitter.id.toStdString())) {
            em["lat"] = emitter.lat;
            em["lon"] = emitter.lon;
            m_emitters[i] = em;
            emit emittersChanged();
            return;
        }
    }

    QVariantMap newEmitter;
    newEmitter["id"] = QString::fromStdString(emitter.id.toStdString());
    newEmitter["type"] = QString::fromStdString(emitter.type.toStdString());
    newEmitter["category"] = QString::fromStdString(emitter.category.toStdString());
    newEmitter["lat"] = emitter.lat;
    newEmitter["lon"] = emitter.lon;
    m_emitters.append(newEmitter);
    emit emittersChanged();
}

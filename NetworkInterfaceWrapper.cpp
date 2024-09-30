#include "NetworkInterfaceWrapper.h"

NetworkInterfaceWrapper::NetworkInterfaceWrapper(AbstractNetworkInterface* interface, QObject *parent)
    : QObject(parent), m_interface(interface) {}

void NetworkInterfaceWrapper::initialise(const QString& address, unsigned short port) {
    try {
        m_interface->initialise(address.toStdString(), port);
    } catch (const std::exception& e) {
        emit error(QString::fromStdString(e.what()));
    }
}

bool NetworkInterfaceWrapper::sendPE(const QVariantMap& pe) {
    try {
        return m_interface->sendPE(convertToPE(pe));
    } catch (const std::exception& e) {
        emit error(QString::fromStdString(e.what()));
        return false;
    }
}

QVariantMap NetworkInterfaceWrapper::receivePE() {
    try {
        return convertFromPE(m_interface->receivePE());
    } catch (const std::exception& e) {
        emit error(QString::fromStdString(e.what()));
        return QVariantMap();
    }
}

bool NetworkInterfaceWrapper::sendEmitter(const QVariantMap& emitter) {
    try {
        return m_interface->sendEmitter(convertToEmitter(emitter));
    } catch (const std::exception& e) {
        emit error(QString::fromStdString(e.what()));
        return false;
    }
}

QVariantMap NetworkInterfaceWrapper::receiveEmitter() {
    try {
        return convertFromEmitter(m_interface->receiveEmitter());
    } catch (const std::exception& e) {
        emit error(QString::fromStdString(e.what()));
        return QVariantMap();
    }
}

bool NetworkInterfaceWrapper::sendComplexBlob(const QVariantMap& pe, const QVariantMap& emitter, const QVariantMap& doubleMap) {
    try {
        return m_interface->sendComplexBlob(convertToPE(pe), convertToEmitter(emitter), convertToDoubleMap(doubleMap));
    } catch (const std::exception& e) {
        emit error(QString::fromStdString(e.what()));
        return false;
    }
}

QVariantList NetworkInterfaceWrapper::receiveComplexBlob() {
}

bool NetworkInterfaceWrapper::sendEmitterSetting(const QString& setting, const QString& id, int updateVal) {
    try {
        return m_interface->sendEmitterSetting(setting.toStdString(), id.toStdString(), updateVal);
    } catch (const std::exception& e) {
        emit error(QString::fromStdString(e.what()));
        return false;
    }
}

bool NetworkInterfaceWrapper::sendPESetting(const QString& setting, const QString& id, int updateVal) {
    try {
        return m_interface->sendPESetting(setting.toStdString(), id.toStdString(), updateVal);
    } catch (const std::exception& e) {
        emit error(QString::fromStdString(e.what()));
        return false;
    }
}

QVariantList NetworkInterfaceWrapper::receiveSetting() {
}

// TODO: Implement conversion methods between C++ and QML entities

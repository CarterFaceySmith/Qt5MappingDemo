#include "AbstractNetworkInterface.h"
#include <boost/asio.hpp>
#include <QJsonObject>
#include <QJsonDocument>
#include <iostream>
#include <stdexcept>

NetworkImplementation::NetworkImplementation()
    : socket(std::make_unique<boost::asio::ip::tcp::socket>(io_context)) {}

void NetworkImplementation::initialize(const std::string& address, unsigned short port) {
    std::lock_guard<std::mutex> lock(mutex);
    try {
        if (socket && socket->is_open()) {
            socket->close();
        }
        boost::asio::ip::tcp::endpoint endpoint(boost::asio::ip::address::from_string(address), port);

        std::cout << "Attempting to connect to " << address << ":" << port << std::endl;

        socket->connect(endpoint);
        std::cout << "Connected successfully to " << address << ":" << port << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Detailed connection error: " << e.what() << std::endl;
        logError("Failed to initialize connection: " + std::string(e.what()));
        throw;
    }
}

PE NetworkImplementation::receivePE() {
    std::lock_guard<std::mutex> lock(mutex);
    if (!isConnected()) {
        throw std::runtime_error("Not connected");
    }
    try {
        boost::asio::streambuf buf;
        boost::asio::read_until(*socket, buf, '\n');
        std::string data{boost::asio::buffers_begin(buf.data()),
                         boost::asio::buffers_end(buf.data())};
        buf.consume(buf.size());
        validateAndPrintDataBufferSize(data, "receivePE");
        return deserializePE(data);
    } catch (const boost::system::system_error& e) {
        if (e.code() == boost::asio::error::eof) {
            logError("Connection closed by server");
        } else {
            logError("Failed to receive PE: " + std::string(e.what()));
        }
        socket->close();
        throw;
    } catch (const std::exception& e) {
        logError("Failed to receive PE: " + std::string(e.what()));
        socket->close();
        throw;
    }
}

Emitter NetworkImplementation::receiveEmitter() {
    std::lock_guard<std::mutex> lock(mutex);
    if (!isConnected()) {
        throw std::runtime_error("Not connected");
    }
    try {
        boost::asio::streambuf buf;
        boost::asio::read_until(*socket, buf, '\n');
        std::string data{boost::asio::buffers_begin(buf.data()),
                         boost::asio::buffers_end(buf.data())};
        buf.consume(buf.size());
        validateAndPrintDataBufferSize(data, "receiveEmitter");
        return deserializeEmitter(data);
    } catch (const boost::system::system_error& e) {
        if (e.code() == boost::asio::error::eof) {
            logError("Connection closed by server");
        } else {
            logError("Failed to receive Emitter: " + std::string(e.what()));
        }
        socket->close();
        throw;
    } catch (const std::exception& e) {
        logError("Failed to receive Emitter: " + std::string(e.what()));
        socket->close();
        throw;
    }
}

bool NetworkImplementation::isConnected() const {
    return socket && socket->is_open();
}

void NetworkImplementation::close() {
    std::lock_guard<std::mutex> lock(mutex);
    if (socket && socket->is_open()) {
        boost::system::error_code ec;
        socket->close(ec);
        if (ec) {
            logError("Failed to close socket: " + ec.message());
        }
    }
}

void NetworkImplementation::validateAndPrintDataBufferSize(std::string dataBuff, std::string funcName) {
    dataBuff.data() ? std::cout << funcName << " - Received intact data buffer of length: "
                                << dataBuff.length() << std::endl
                    : std::cerr << "Received invalid data buffer of length: "
                                << dataBuff.length() << std::endl;
}

void NetworkImplementation::logError(const std::string& message) {
    std::cerr << "NetworkImplementation Error: " << message << std::endl;
}

PE NetworkImplementation::deserializePE(const std::string& data) {
    QJsonDocument doc = QJsonDocument::fromJson(QString::fromStdString(data).toUtf8());
    if (doc.isNull()) {
        logError("Invalid JSON data for PE deserialization");
        throw std::runtime_error("Invalid JSON data for PE deserialization");
    }
    QJsonObject json = doc.object();

    PE pe(
        QString::fromStdString(json["id"].toString().toStdString()),
        QString::fromStdString(json["type"].toString().toStdString()),
        json["lat"].toDouble(),
        json["lon"].toDouble(),
        json["altitude"].toDouble(),
        json["speed"].toDouble(),
        QString::fromStdString(json["apd"].toString().toStdString()),
        QString::fromStdString(json["priority"].toString().toStdString()),
        json["jam"].toBool(),
        json["ghost"].toBool()
    );
    pe.heading = json["heading"].toDouble();
    pe.category = static_cast<PE::PECategory>(json["category"].toInt());
    pe.state = QString::fromStdString(json["state"].toString().toStdString());

    return pe;
}

Emitter NetworkImplementation::deserializeEmitter(const std::string& data) {
    QJsonDocument doc = QJsonDocument::fromJson(QString::fromStdString(data).toUtf8());
    if (doc.isNull()) {
        logError("Invalid JSON data for Emitter deserialization");
        throw std::runtime_error("Invalid JSON data for Emitter deserialization");
    }
    QJsonObject json = doc.object();

    Emitter emitter(
        QString::fromStdString(json["id"].toString().toStdString()),
        QString::fromStdString(json["type"].toString().toStdString()),
        QString::fromStdString(json["category"].toString().toStdString()),
        json["lat"].toDouble(),
        json["lon"].toDouble(),
        json["freqMin"].toDouble(),
        json["freqMax"].toDouble(),
        json["active"].toBool(),
        QString::fromStdString(json["eaPriority"].toString().toStdString()),
        QString::fromStdString(json["esPriority"].toString().toStdString()),
        json["jamResponsible"].toBool(),
        json["reactiveEligible"].toBool(),
        json["preemptiveEligible"].toBool(),
        json["consentRequired"].toBool(),
        json["jam"].toBool()
    );
    emitter.altitude = json["altitude"].toDouble();
    emitter.heading = json["heading"].toDouble();
    emitter.speed = json["speed"].toDouble();
    emitter.operatorManaged = json["operatorManaged"].toBool();
    emitter.jamIneffective = json["jamIneffective"].toInt();
    emitter.jamEffective = json["jamEffective"].toInt();

    return emitter;
}

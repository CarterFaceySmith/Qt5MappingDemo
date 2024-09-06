#include "Entity.h"
#include <QDebug>
#include <cmath>

Entity::Entity(QObject *parent)
    : QObject(parent), m_name("Unknown"), m_symbol(EntitySymbol::UNKNOWN),
      m_UID("UKN"), m_speed(0.0), m_radius(0.0), m_altitude(0.0),
      m_latitudeRadians(0.0), m_longitudeRadians(0.0)
{
}

QString Entity::name() const
{
    return m_name;
}

void Entity::setName(const QString &name)
{
    if (m_name != name) {
        m_name = name;
        emit nameChanged();
    }
}
EntitySymbol Entity::symbol() const
{
    return m_symbol;
}

void Entity::setSymbol(const EntitySymbol &symbol)
{
    if (m_symbol != symbol) {
        m_symbol = symbol;
        emit symbolChanged();
    }
}

QString Entity::UID() const
{
    return m_UID;
}

void Entity::setUID(const QString &UID)
{
    if (m_UID != UID) {
        m_UID = UID;
        qDebug() << "CPP: Entity UID changed to " << UID;
        emit UIDChanged();
    }
}

double Entity::speed() const
{
    return m_radius;
}

void Entity::setSpeed(double speed)
{
    if (m_speed != speed) {
        m_speed = speed;
        emit speedChanged();
    }
}

double Entity::altitude() const
{
    return m_altitude;
}

void Entity::setAltitude(double altitude)
{
    if (m_altitude != altitude) {
        m_altitude = altitude;
        emit altitudeChanged();
    }
}

double Entity::radius() const
{
    return m_radius;
}

void Entity::setRadius(double radius)
{
    if (m_radius != radius) {
        m_radius = radius;
        emit radiusChanged();
    }
}

double Entity::latitudeRadians() const
{
    return m_latitudeRadians;
}

void Entity::setLatitudeRadians(double latitudeRadians)
{
    if (m_latitudeRadians != latitudeRadians) {
        m_latitudeRadians = latitudeRadians;
        qDebug() << "Entity lat changed to " << latitudeRadians;
        emit latitudeRadiansChanged();
    }
}

double Entity::returnLatAsDeg() const
{
    return (m_latitudeRadians * 180) / M_PI;
}

double Entity::longitudeRadians() const
{
    return m_longitudeRadians;
}

void Entity::setLongitudeRadians(double longitudeRadians)
{
    if (m_longitudeRadians != longitudeRadians) {
        m_longitudeRadians = longitudeRadians;
        qDebug() << "Entity long changed to " << longitudeRadians;
        emit longitudeRadiansChanged();
    }
}

double Entity::returnLongAsDeg() const
{
    return (m_longitudeRadians * 180) / M_PI;
}

void Entity::logMessage(const QString &message) {
    qDebug() << "CPP: Entity logged message: " << message;
}

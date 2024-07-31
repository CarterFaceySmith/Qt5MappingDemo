#include "Entity.h"
#include <QDebug>

Entity::Entity(QObject *parent)
    : QObject(parent), m_name("Unknown"), m_type(entityType::UNKNOWN), m_UID("UKN"), m_speed(0.0), m_radius(0.0), m_altitude(0.0), m_latitude(0.0), m_longitude(0.0)
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

entityType Entity::type() const
{
    return m_type;
}

void Entity::setType(const entityType &type)
{
    if (m_type != type) {
        m_type = type;
        emit typeChanged();
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

double Entity::latitude() const
{
    return m_latitude;
}

void Entity::setLatitude(double latitude)
{
    if (m_latitude != latitude) {
        m_latitude = latitude;
        emit latitudeChanged();
    }
}

double Entity::longitude() const
{
    return m_longitude;
}

void Entity::setLongitude(double longitude)
{
    if (m_longitude != longitude) {
        m_longitude = longitude;
        emit longitudeChanged();
    }
}

void Entity::doSomething(int value)
{
    qDebug() << "doSomething called with value:" << value;
}

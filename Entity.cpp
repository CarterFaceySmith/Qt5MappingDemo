#include "Entity.h"

Entity::Entity(QObject *parent)
    : QObject(parent), m_radius(0), m_latitude(0.0), m_longitude(0.0)
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

// QPixmap Entity::icon() const
// {
//     return m_icon;
// }

// void Entity::setIcon(const QPixmap &icon)
// {
//     if (m_icon != icon) {
//         m_icon = icon;
//         emit iconChanged();
//     }
// }

int Entity::radius() const
{
    return m_radius;
}

void Entity::setRadius(int radius)
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

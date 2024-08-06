#include "EntityManager.h"
#include <QVariantMap>
#include <QDebug>

EntityManager::EntityManager(QObject *parent)
    : QObject(parent)
{
}

void EntityManager::createEntity(const QString &name, const QString &UID, double radius, double latitude, double longitude)
{
    Entity *entity = new Entity(this);
    entity->setName(name);
    entity->setUID(UID);
    entity->setRadius(radius);
    entity->setLatitudeRadians(latitude);
    entity->setLongitudeRadians(longitude);

    m_database.append(entity);
    emit entityCreated(entity);
    qDebug() << "CPP; Created entity with name" << name << "and UID" << UID << "at lat" << latitude << "long" << longitude;
}

Entity* EntityManager::getEntityByUID(const QString &UID) const
{
    for (Entity *entity : m_database) {
        if (entity->UID() == UID) {
            qDebug() << "CPP: Found entity UID: " << UID;
            return entity;
        }
    }
    qDebug() << "CPP: Couldn't find entity UID: " << UID;
    return nullptr;
}

void EntityManager::printAllEntities()
{
    for (const Entity *entity : m_database) {
        qDebug() << "CPP: Entity Name:" << entity->name();
        qDebug() << "CPP: Entity UID:" << entity->UID();
        qDebug() << "CPP: Entity Radius:" << entity->radius();
        qDebug() << "CPP: Entity Lat:" << entity->latitudeRadians();
        qDebug() << "CPP: Entity Long:" << entity->longitudeRadians();
    }
}

QVariantMap EntityManager::getEntityList() const
{
    QVariantMap resultMap;

    QList<QVariant> entityList;
    for (Entity* entity : m_database) {
        QVariantMap entityMap;
        entityMap["name"] = entity->name();
        entityMap["UID"] = entity->UID();
        entityMap["radius"] = entity->radius();
        entityMap["latitude"] = entity->latitudeRadians();
        entityMap["longitude"] = entity->longitudeRadians();
        entityList.append(entityMap);
    }

    resultMap["entities"] = entityList;
    return resultMap;
}

void EntityManager::logMessage(const QString &message) {
    qDebug() << "CPP: EntityManager logged message: " << message;
}

// Q_DECLARE_METATYPE(EntityManager);

#include "EntityManager.h"
#include <QVariantMap>
#include <QDebug>

EntityManager::EntityManager(QObject *parent)
    : QObject(parent)
{
}

Entity* EntityManager::createEntity(const QString &name, const QString &UID, double radius, double latitude, double longitude)
{
    Entity *entity = new Entity(this);
    entity->setName(name);
    entity->setUID(UID);
    entity->setRadius(radius);
    entity->setLatitude(latitude);
    entity->setLongitude(longitude);

    m_database.append(entity);
    emit entityCreated(entity);
    qDebug() << "Created entity with name " << name << " and UID " << UID;
    return entity;
}

Entity* EntityManager::getEntityByUID(const QString &UID) const
{
    for (Entity *entity : m_database) {
        if (entity->UID() == UID) {
            qDebug() << "Found entity ID:" << UID;
            return entity;
        }
    }
    qDebug() << "Couldn't find entity ID:" << UID;
    return nullptr;
}

void EntityManager::updateEntityId(const QString &currentId, const QString &newId)
{
    for (Entity *entity : m_database) {
        if (entity->UID() == currentId) {
            entity->setUID(newId);
            emit entityUpdated(entity);
            qDebug() << "Updated entity ID to:" << newId;
        }
        qDebug() << "No matching UID found for UID: " << currentId;
    }
}


void EntityManager::printAllEntities()
{
    for (const Entity *entity : m_database) {
        qDebug() << "Entity Name:" << entity->name();
        qDebug() << "Entity UID:" << entity->UID();
        qDebug() << "Entity Radius:" << entity->radius();
        qDebug() << "Entity Lat:" << entity->latitude();
        qDebug() << "Entity Long:" << entity->longitude();
    }
}

QList<QObject*> EntityManager::getEntityList() const
{
    QList<QObject*> entityList;
    for (Entity* entity : m_database){
        entityList.append(entity);
    }
    return entityList;
}

void EntityManager::logMessage(const QString &message) {
    qDebug() << "EntityManager logged message: " << message;
}

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
    return entity;
}

Entity* EntityManager::getEntityByUID(const QString &UID) const
{
    for (Entity *entity : m_database) {
        if (entity->UID() == UID) {
            return entity;
        }
    }
    return nullptr;
}

void EntityManager::updateEntityId(const QString &newId) {
    qDebug() << "Updating entity ID to:" << newId;
}

QList<QVariantMap> EntityManager::listAllEntities() const
{
    QList<QVariantMap> result;
    for (const Entity *entity : m_database) {
        QVariantMap entityMap;
        entityMap["Name"] = entity->name();
        entityMap["UID"] = entity->UID();        
        entityMap["Radius"] = entity->radius();
        entityMap["Latitude"] = entity->latitude();
        entityMap["Longitude"] = entity->longitude();
        result.append(entityMap);
    }
    return result;
}

void EntityManager::logMessageEM(const QString &message) {
    qDebug() << "EntityManager logged message: " << message;
}

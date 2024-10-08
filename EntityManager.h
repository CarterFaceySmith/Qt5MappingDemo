#ifndef ENTITYMANAGER_H
#define ENTITYMANAGER_H

#include <QObject>
#include <QList>
#include <QVariantMap>
#include "Entity.h"

class EntityManager : public QObject
{
    Q_OBJECT
public:
    explicit EntityManager(QObject *parent = nullptr);

public slots:
    Entity* getEntityByUID(const QString &UID) const;
    QVariantMap getEntityList() const;
    void createEntity(const QString &name, const QString &UID, double radius, double latitude, double longitude);
    void printAllEntities();
    void logMessage(const QString &message);

signals:
    void entityCreated(Entity* entity);
    void entityUpdated(Entity* entity);

private:
    QList<Entity*> m_database;
};

#endif // ENTITYMANAGER_H

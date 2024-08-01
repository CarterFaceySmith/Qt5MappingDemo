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
    Q_INVOKABLE Entity* getEntityByUID(const QString &UID) const;
    Q_INVOKABLE QList<QVariantMap> listAllEntities() const;

public slots:
    void updateEntityId(const QString &newId);
    Entity* createEntity(const QString &name, const QString &UID, double radius, double latitude, double longitude);
    void logMessage(const QString &message);

private:
    QList<Entity*> m_database;
};

#endif // ENTITYMANAGER_H

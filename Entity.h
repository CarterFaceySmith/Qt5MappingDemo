#ifndef ENTITY_H
#define ENTITY_H

#include <QObject>
#include <QString>

enum entityType
{
    BLUE,
    RED,
    UNKNOWN
};

class Entity : public QObject
{
    Q_OBJECT

    // Properties
    Q_PROPERTY(QString name READ name WRITE setName NOTIFY nameChanged)
    Q_PROPERTY(entityType type READ type WRITE setType NOTIFY typeChanged)
    Q_PROPERTY(QString UID READ UID WRITE setUID NOTIFY UIDChanged)

    // Geometry
    Q_PROPERTY(double speed READ speed WRITE setSpeed NOTIFY speedChanged)
    Q_PROPERTY(double radius READ radius WRITE setRadius NOTIFY radiusChanged)
    Q_PROPERTY(double altitude READ altitude WRITE setAltitude
               NOTIFY altitudeChanged)
    Q_PROPERTY(double latitude READ latitude WRITE setLatitude
               NOTIFY latitudeChanged)
    Q_PROPERTY(double longitude READ longitude WRITE setLongitude
               NOTIFY longitudeChanged)

public:
    explicit Entity(QObject *parent = nullptr);

    // Properties
    QString name() const;
    void setName(const QString &name);

    entityType type() const;
    void setType(const entityType &type);

    QString UID() const;
    void setUID(const QString &UID);

    // Geometry
    double speed() const;
    void setSpeed(double speed);

    double radius() const;
    void setRadius(double radius);

    double altitude() const;
    void setAltitude(double altitude);

    double latitude() const;
    void setLatitude(double latitude);

    double longitude() const;
    void setLongitude(double longitude);

public slots:
    void logMessageEntity(const QString &message);

signals:
    void nameChanged();
    void typeChanged();
    void UIDChanged();
    void speedChanged();
    void radiusChanged();
    void altitudeChanged();
    void latitudeChanged();
    void longitudeChanged();

private:
    QString m_name;
    entityType m_type;
    QString m_UID;
    double m_speed;
    double m_radius;
    double m_altitude;
    double m_latitude;
    double m_longitude;
};

#endif // ENTITY_H

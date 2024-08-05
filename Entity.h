#ifndef ENTITY_H
#define ENTITY_H

#include <QObject>
#include <QString>

enum EntitySymbol
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
    Q_PROPERTY(EntitySymbol symbol READ symbol WRITE setSymbol NOTIFY symbolChanged)
    Q_PROPERTY(QString UID READ UID WRITE setUID NOTIFY UIDChanged)

    // Geometry
    Q_PROPERTY(double speed READ speed WRITE setSpeed NOTIFY speedChanged)
    Q_PROPERTY(double radius READ radius WRITE setRadius NOTIFY radiusChanged)
    Q_PROPERTY(double altitude READ altitude WRITE setAltitude
               NOTIFY altitudeChanged)
    Q_PROPERTY(double latitudeRadians READ latitudeRadians WRITE setLatitudeRadians
               NOTIFY latitudeRadiansChanged)
    Q_PROPERTY(double longitudeRadians READ longitudeRadians WRITE setLongitudeRadians
               NOTIFY longitudeRadiansChanged)

public:
    explicit Entity(QObject *parent = nullptr);

public slots:
    // Properties
    QString name() const;
    void setName(const QString &name);

    EntitySymbol symbol() const;
    void setSymbol(const EntitySymbol &symbol);

    QString UID() const;
    void setUID(const QString &UID);

    // Geometry
    double speed() const;
    void setSpeed(double speed);

    double radius() const;
    void setRadius(double radius);

    double altitude() const;
    void setAltitude(double altitude);

    double latitudeRadians() const;
    void setLatitudeRadians(double latitudeRadians);
    double returnLatAsDeg() const;

    double longitudeRadians() const;
    void setLongitudeRadians(double longitudeRadians);
    double returnLongAsDeg() const;

    void logMessage(const QString &message);

signals:
    void nameChanged();
    void symbolChanged();
    void UIDChanged();
    void speedChanged();
    void radiusChanged();
    void altitudeChanged();
    void latitudeRadiansChanged();
    void longitudeRadiansChanged();

private:
    QString m_name;
    EntitySymbol m_symbol;
    QString m_UID;
    double m_speed;
    double m_radius;
    double m_altitude;
    double m_latitudeRadians;
    double m_longitudeRadians;
};

#endif // ENTITY_H

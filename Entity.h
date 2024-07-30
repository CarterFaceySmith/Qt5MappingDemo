#ifndef ENTITY_H
#define ENTITY_H

#include <QObject>
#include <QPixmap>
#include <QString>

class Entity : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString name READ name WRITE setName NOTIFY nameChanged)
    Q_PROPERTY(QString UID READ UID WRITE setUID NOTIFY UIDChanged)
    // Q_PROPERTY(QPixmap icon READ icon WRITE setIcon NOTIFY iconChanged)
    Q_PROPERTY(int radius READ radius WRITE setRadius NOTIFY radiusChanged)
    Q_PROPERTY(double latitude READ latitude WRITE setLatitude NOTIFY latitudeChanged)
    Q_PROPERTY(double longitude READ longitude WRITE setLongitude NOTIFY longitudeChanged)

public:
    explicit Entity(QObject *parent = nullptr);

    QString name() const;
    void setName(const QString &name);

    QString UID() const;
    void setUID(const QString &UID);

    // QPixmap icon() const;
    // void setIcon(const QPixmap &icon);

    int radius() const;
    void setRadius(int radius);

    double latitude() const;
    void setLatitude(double latitude);

    double longitude() const;
    void setLongitude(double longitude);

signals:
    void nameChanged();
    void UIDChanged();
    // void iconChanged();
    void radiusChanged();
    void latitudeChanged();
    void longitudeChanged();

private:
    QString m_name;
    QString m_UID;
    // QPixmap m_icon;
    int m_radius;
    double m_latitude;
    double m_longitude;
};

#endif // ENTITY_H

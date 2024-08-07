Partial guide to creating and running a map tile server for OpenStreetMap (OSM) tiles on Windows, tailored to avoid using Docker (normally you'd likely set this up as an Apache server or something and run it in a container).

Further resource: [Switch2OSM - Building a tile server](https://switch2osm.org/serving-tiles/manually-building-a-tile-server-debian-12)

Uses: PostgreSQL with PostGIS, osm2pgsql, and TileStache.

1. Install PostgreSQL and PostGIS

    - Download PostgreSQL:
        - Go to the PostgreSQL Windows download page.
        - Download and run the installer (e.g., postgresql-14.5-1-windows-x64.exe).
        
    - Install PostGIS:
        - Download and run the PostGIS installer from the PostGIS binaries page.

    - Verify Installation:
        - Open the pgAdmin tool.
        - Connect to the PostgreSQL server using the postgres user.
        - Check if PostGIS is installed by running: `SELECT PostGIS_full_version();`

2. Set Up the DB

    - Open psql Command Line Tool:
        - Access it via the PostgreSQL Start Menu folder or from the command line:  `psql -U postgres`

    - Create and configure the new database:
```sql
CREATE DATABASE gis_utf8;
\c gis_utf8
CREATE EXTENSION postgis;
SELECT PostGIS_full_version();
```

3. Install osm2pgsql

    - Download and extract osm2pgsql:
        - Download the Windows binaries for osm2pgsql from the osm2pgsql releases page.

    - Add osm2pgsql to PATH:
        - Copy the osm2pgsql.exe file to a directory of your choice.
        - Add this directory to your system’s PATH environment variable.

4. Download and Import OSM Data

    - Obtain an OSM PBF file from Geofabrik, e.g., australia-latest.osm.pbf.

    - Import OSM Data into PostgreSQL:
        Open Command Prompt and run your ver of: `osm2pgsql -d gis_utf8 -C 2048 --create --slim -G --hstore -S "C:\path\to\osm2pgsql.default.style" "C:\path\to\australia-latest.osm.pbf"`

5. Install TileStache (Optional, requires Python)

    - `pip install tilestache`

    - Create a Configuration File:
        - Create a file named tile_stache.cfg with the following content:
    ```
    [cache]
    type = "file"
    directory = "cache"

    [layers]
    [osm]
    type = "postgis"
    host = "localhost"
    port = 5432
    user = "postgres"
    password = "your_password"
    dbname = "gis_utf8"
    table = "planet_osm_line"  # Change to "planet_osm_point", "planet_osm_polygon" as needed, see online docs for diff
    ```

    - Run TileStache: `tilestache-server.py --config tile_stache.cfg`

6. Verify the Tile Server

    - Open a Web Browser:
        - Navigate to http://localhost:8080/ or your configured port.
        - Verify that tiles are being served by checking the tile URLs.
        
7. Where to go from there

In `mapScript.js` there is a tilelayer function that defines and enables multiple tile servers and layer styles, to access your tile server you can add a new entry or amend an existing one to point to your localhost URL.

Something like this:

```js
const tileLayers = {
        osm: 'http://localhost:80/{z}/{x}/{y}.png', // Updated to point to local tile server
        'stamen-terrain': 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png?api_key=5a677b5d-7b56-450a-b358-2d5a5a8af829',
        'carto-light': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    };
```

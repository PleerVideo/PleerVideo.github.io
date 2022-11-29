# Pleer Backend

Restore database:

```bash
sudo su postgres
pg_restore -c -U postgres -d pleer -v "/tmp/pleer.dump" -W
```

Create `.env`:

```bash
PG_USER=""
PG_PASS="" 
PG_IP=""
PG_PORT=""
PG_DB=""
```

Stiils:

```bash
mkdir -p public; 
npm init -y; 
npm i --save image-size async pg; 
PGUSER="postgres" PGHOST="IP SERVER" PGPASSWORD="password" PGDATABASE="pleer" PGPORT=23873 node ./stills.js;
```

Posters:

```bash
PGUSER="postgres" PGHOST="IP" PGPASSWORD="password" PGDATABASE="pleer" PGPORT=23873 node /home/pleer.video/lib/img.js poster;
```

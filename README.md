# Pleer Backend

## **250К** Posters (`8.08GB`)

https://mega.nz/file/9TNmCD5Y#Y4C7F2_T29GhtnET0DkvAAdanZUQ1pS17GXcLPbLoek

```
/poster/{KINOPOISK_ID}.webp
```

## **50К** Stills (`7.52GB`)

https://mega.nz/file/gPsyzBYK#RIvcTTG_D0b6wjx5_lcMD1RIGUACozvKlfwAlKy_Aqs

```
/still/{KINOPOISK_ID}.jpg
```

### Database (`694 163 movies`)

https://mega.nz/file/sLMjFAjI#YsejGGXtjFgGFzFuYpVUVzkFcUYR-HYQWT_BPzGwZ7o

```bash
sudo su postgres
pg_restore -c -U postgres -d pleer -v "/tmp/pleer.dump" -W
```

### Create `.env`:

```bash
PG_USER=""
PG_PASS="" 
PG_IP=""
PG_PORT=""
PG_DB=""
```

### Stiils:

```bash
mkdir -p public; 
npm init -y; 
npm i --save image-size async pg; 
PGUSER="postgres" PGHOST="IP SERVER" PGPASSWORD="password" PGDATABASE="pleer" PGPORT=23873 node ./stills.js;
```

### Posters:

```bash
PGUSER="postgres" PGHOST="IP" PGPASSWORD="password" PGDATABASE="pleer" PGPORT=23873 node /home/pleer.video/lib/img.js poster;
```

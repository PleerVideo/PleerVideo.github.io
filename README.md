# Pleer Video

<img src="https://raw.githubusercontent.com/PleerVideo/PleerVideo.github.io/main/mstile-150x150.png" alt="Pleer.Video API/Posters/Stills">

## **250К** Posters (`8.08GB`)

<img src="https://raw.githubusercontent.com/PleerVideo/PleerVideo.github.io/main/535341.webp" alt="Poster">

https://mega.nz/file/9TNmCD5Y#Y4C7F2_T29GhtnET0DkvAAdanZUQ1pS17GXcLPbLoek

```
/poster/{KINOPOISK_ID}.webp
```

## **50К** Stills (`7.52GB`)

<img src="https://raw.githubusercontent.com/PleerVideo/PleerVideo.github.io/main/535341.jpg" alt="Still">

https://mega.nz/file/gPsyzBYK#RIvcTTG_D0b6wjx5_lcMD1RIGUACozvKlfwAlKy_Aqs

```
/still/{KINOPOISK_ID}.jpg
```

### Database (`694 163 movies`)

https://mega.nz/file/sLMjFAjI#YsejGGXtjFgGFzFuYpVUVzkFcUYR-HYQWT_BPzGwZ7o

```bash
pg_restore -c -U postgres -d pleer -v "/tmp/pleer.dump" -W
```

```json
{
    "kp_id": 535341,
    "imdb_id": "1675434",
    "tmdb_id": 77338,
    "wa_id": null,
    "douban_id": null,
    "title_ru": "1+1",
    "title_en": "1+1",
    "year": 2011,
    "countries": "Франция",
    "directors": "Оливье Накаш,Эрик Толедано",
    "genres": "драма,комедия,биография",
    "actors": "Франсуа Клюзе,Омар Си,Анн Ле Ни,Одри Флеро,Жозефин де Мо",
    "description": "Пострадав в результате несчастного случая, богатый аристократ Филипп нанимает в помощники человека, который менее всего подходит для этой работы, – молодого жителя предместья Дрисса, только что освободившегося из тюрьмы. Несмотря на то, что Филипп прикован к инвалидному креслу, Дриссу удается привнести в размеренную жизнь аристократа дух приключений.",
    "pictures": "1847777,1847776,1674501",
    "premiere": "2011-09-23",
    "kp_rating": 88,
    "kp_vote": 1261274,
    "imdb_rating": 85,
    "imdb_vote": 779376,
    "poster": 1,
    "still": 1,
    "type": 0
}
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

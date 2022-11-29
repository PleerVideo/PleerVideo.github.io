'use strict';

const fs = require('fs');

require('dotenv').config();

const LRU = require('lru-cache');
let cache = new LRU({
    max: 1000,
    maxAge: 3600000
});

const fastify = require('fastify')();
fastify.register(require('fastify-postgres'), {
    connectionString: `postgres://${process.env.PG_USER}:${process.env.PG_PASS}@${process.env.PG_IP}:${process.env.PG_PORT}/${process.env.PG_DB}`
});

const error = fs.readFileSync('404.html');

fastify.get('/:id', (req, reply) => {
    const id = (req.params.id || '').replace(/[^0-9]/g, '');
    const json = (req.params.id || '').replace(/[^a-z.]/g, '') === '.json';
    const key = id + json;
    const data = cache.get(key);
    if (!id || parseInt(id) < 298 || parseInt(id) > 9000000) {
        if (json) {
            return reply.code(404).send({error: '404 - Not Found'});
        } else {
            return reply.code(404).type('text/html').send(error);
        }
    }
    if (data) {
        if (json) {
            if (data === 404) {
                return reply.code(404).send({error: '404 - Not Found'});
            } else {
                return reply.code(200).send(data);
            }
        } else {
            if (data === 404) {
                return reply.code(404).type('text/html').send(error);
            } else {
                reply.header('Link', '<https://pleer.video/' + id + '.html>; rel="canonical"');
                return reply.code(200).type('text/html').send(data);
            }
        }
    }
    fastify.pg.query(
        'SELECT * FROM movies WHERE kp_id=$1 LIMIT 1', [ id ],
        (err, result) => {
            if (err) console.error(err);
            if (result && result.rows && result.rows.length) {
                const movie = result.rows[0];
                delete movie.weighted_tsv;
                if (json) {
                    cache.set(key, movie);
                    return reply.code(200).send(movie);
                } else {
                    if (!movie.embeds || !movie.embeds.length) {
                        cache.set(key, 404);
                        return reply.code(404).type('text/html').send(error);
                    }

                    let season_episode = '';
                    let last_season = '';
                    let last_episode = '';
                    let last_iframe = '';

                    let ls = false;
                    let le = false;

                    if (movie.type && movie.embeds.length) {
                        let seasons = {};
                        movie.embeds.forEach(function (episode) {
                            if (!seasons[episode.season]) {
                                seasons[episode.season] = {};
                            }
                            if (!seasons[episode.season][episode.episode] && episode.ivi_id) {
                                seasons[episode.season][episode.episode] =
                                    'https://www.ivi.ru/player/video/?autostart=0&app_version=19520&videoid=' + episode.ivi_id;
                            }
                        });
                        let html_season_start = '<select onchange="season(this)" class="seasons">';
                        let html_seasons = [];
                        let html_season_end = '</select>';
                        let html_seasons_episodes = [];
                        Object
                            .keys(seasons)
                            .sort(function (a, b) {
                                return (+b) - (+a)
                            })
                            .forEach(function (season, i1) {
                                if (!i1) {
                                    last_season = ' ' + [...Array((season && parseInt(season) || 1)).keys()].map(i => ++i).join(',') + ' сезон';
                                    ls = true;
                                } else {
                                    ls = false;
                                }
                                html_seasons.push('<option value="' + season + '"' + (ls
                                    ? ' selected="selected"'
                                    : '') + '>Сезон ' + season + '</option>');
                                let html_episode_start = '<select onchange="episode(this)" class="season S' + season + '"' + (!ls
                                    ? ' style="display:none"'
                                    : ' style="display:inline-block"') + '>';
                                let html_episode_end = '</select>';
                                let html_episodes = [];
                                Object.keys(seasons[season]).sort(function (a, b) {
                                    return (+b) - (+a)
                                }).forEach(function (episode, i2) {
                                    if (ls && !i2) {
                                        last_episode = ' ' + [...Array(parseInt(episode)).keys()].map((i) => ++i).join(',') + ' серия';
                                        last_iframe = seasons[season][episode];
                                        le = true;
                                    } else {
                                        le = false;
                                    }
                                    html_episodes.push('<option value="' + seasons[season][episode] + '" class="episode S' + season + 'E' + episode + '"' + (le
                                        ? ' selected="selected"'
                                        : '') + '>Серия ' + episode + '</option>');
                                });
                                html_seasons_episodes.push(html_episode_start + html_episodes.join('') + html_episode_end);
                            });
                        season_episode =
                            '<div>' + html_season_start +
                            html_seasons.join('') +
                            html_season_end +
                            html_seasons_episodes.join('') + '</div>';
                    } else {
                        if (movie.embeds.length === 1) {
                            last_iframe = 'https://www.ivi.ru/player/video/?autostart=0&app_version=19520&videoid=' + movie.embeds[0].ivi_id;
                        } else {
                            last_iframe = 'https://www.ivi.ru/player/video/?autostart=0&app_version=19520&videoid=' + movie.embeds[(movie.embeds.length - 1)].ivi_id;
                        }
                    }
                    let html = '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"><link rel="manifest" href="/site.webmanifest"><link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5"><meta name="msapplication-TileColor" content="#2b5797"><meta name="theme-color" content="#161822"><title>' + (movie.title_ru || movie.title_en) + (movie.type ? ' сериал' : ' фильм') + (movie.year ? ' ' + movie.year : '') + last_season + last_episode + ' смотреть онлайн бесплатно в хорошем качестве HD</title><meta name="description" content="' + (movie.type ? 'Сериал' : 'Фильм') + (movie.year ? ' ' + movie.year + ' ' : ' ') + '«' + (movie.title_ru || movie.title_en) + '»' + ' смотреть онлайн бесплатно в хорошем качестве HD' + last_season + last_episode + '"><link rel="stylesheet" type="text/css" href="/r.css"></head><body><iframe src="' + last_iframe + '" allowfullscreen="allowfullscreen" style="position:absolute;border:0;width:100%;height:100%"></iframe>' + season_episode + '<script src="/e.js"></script><div style="display:none"><h1>' + (movie.type ? 'Сериал ' : 'Фильм ') + '«' + (movie.title_ru || movie.title_en) + '»' + (movie.year ? ' ' + movie.year + ' ' : ' ') + 'смотреть онлайн бесплатно в хорошем качестве HD' + last_season + last_episode + '</h1><img src="/' + id + '.jpg" alt="Постер ' + (movie.type ? 'сериала' : 'фильма') + (movie.year ? ' ' + movie.year + ' года ' : ' ') + '«' + (movie.title_ru || movie.title_en) + '» смотреть в HD 1080 4K хорошем качестве онлайн бесплатно' + last_season + last_episode + '"><p>' + [movie.countries, movie.genres, movie.directors, movie.actors, movie.description].filter(Boolean).join('</p><p>') + '</p><p>' + (movie.type ? 'Сериал' : 'Фильм') + (movie.year ? ' ' + movie.year + ' года ' : ' ') + '«' + (movie.title_ru || movie.title_en) + '» смотреть в хорошем качестве HD онлайн бесплатно' + last_season + last_episode + '</p></div><script type="text/javascript">(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)}; m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)}) (window, document, "script", "https://cdn.jsdelivr.net/npm/yandex-metrica-watch/tag.js", "ym"); ym(67691980, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true, trackHash:true });</script><noscript><div><img src="https://mc.yandex.ru/watch/67691980" style="position:absolute; left:-9999px;" alt="" /></div></noscript></body></html>';
                    cache.set(key, html);
                    reply.header('Link', '<https://pleer.video/' + id + '.html>; rel="canonical"');
                    return reply.code(200).type('text/html').send(html);
                }
            } else {
                if (json) {
                    cache.set(key, 404);
                    return reply.code(404).send({error: '404 - Not Found'});
                } else {
                    cache.set(key, 404);
                    return reply.code(404).type('text/html').send(error);
                }
            }
        }
    );
});

fastify.post('/alice-webhook', (req, reply) => {
    if (
        !req ||
        !req.body ||
        !req.body.session ||
        !req.body.session.skill_id ||
        req.body.session.skill_id !== 'ca599c01-c07a-4fb3-b459-3a59e6fdf050'
    ) {
        return reply.code(404).type('text/html').send(error);
    }
    let command = req && req.body && req.body.request && (req.body.request.original_utterance || req.body.request.command);
    if (!command) {
        return reply.send({
            "response": {
                "text": "🖖 Какой фильм или сериал Вам включить?",
                "tts": "Какой фильм или сериал Вам включить?",
                "end_session": false
            },
            "version": "1.0"
        });
    }
    command = command.replace(/\s*👉\s*/i, '').replace(/\s*попроси плеер\s*видео\s*/i, '').replace(/\s*попроси pleer\s*video\s*/i, '').replace(/^(включить|включи|запусти|запустить|найди|найти)\s*/i, '').replace(/^(мне|нам)\s*/i, '').replace(/^(фильм|сериал)\s*/i, '').replace(/\s*смотреть онлайн\s*/i, '').replace(/\s*\([0-9]*?\)\s*/i, '').replace(/\s*[0-9]{4}\s*года\s*/i, '').trim().toUpperCase();
    const c = command.replace(/[^а-я]/ig, '');
    switch (c) {
        case 'ПОМОЩЬ':
        case 'ЧТОТЫУМЕЕШЬ':
        case 'ЧТОТЫМОЖЕШЬ':
            return reply.send({
                "response": {
                    "text": "👩‍💻 Яндекс.Алиса слушает Ваши команды:\n\n\n👉 Запусти навык PLEER VIDEO\n👉 Попроси PLEER VIDEO включить Ералаш\n👉 Попроси PLEER VIDEO найти фильм Гонка\n\n\n🥰 Я быстро активируюсь и найду нужный Вам плеер.видео для онлайн просмотра.",
                    "tts": "Яндекс Алиса слушает Ваши команды: Запусти навык ПЛЕЕР ВИДЕО, или Попроси ПЛЕЕР ВИДЕО включить Ералаш, или Попроси ПЛЕЕР ВИДЕО найти фильм Гонка. Я быстро активируюсь и найду нужный Вам плеер видео для онлайн просмотра.",
                    "end_session": false
                },
                "version": "1.0"
            });
        case 'СПАСИБО':
            return reply.send({
                "response": {
                    "text": "😚 Незачто, всегда рада помочь.",
                    "tts": "Незачто, всегда рада помочь.",
                    "end_session": false
                },
                "version": "1.0"
            });
        case 'НИКАКОЙ':
        case 'ПОКАНЕНАДО':
            return reply.send({
                "response": {
                    "text": "😒 Тю, а зачем тогда позвали меня? Хорошо, отдохну пока. Захотите глянуть киношку, скажите только название.",
                    "tts": "Тю, а зачем тогда позвали меня? Хорошо, отдохну пока. Захотите глянуть киношку, скажите только название.",
                    "end_session": false
                },
                "version": "1.0"
            });
        case 'ХОРОШО':
        case 'ОКАЙ':
        case 'ОКЕЙ':
        case 'ОК':
            return reply.send({
                "response": {
                    "text": "😴",
                    "tts": "",
                    "end_session": false
                },
                "version": "1.0"
            });
        default:
    }
    if (c.indexOf('ПОРНО') + 1) {
        return reply.send({
            "response": {
                "text": "😏 Так, так, так, кто-то ошибся адресом, Вам нужно на кое-какой хаб.com",
                "tts": "Так, так, так, кто-то ошибся адресом, Вам нужно на кое-какой хаб точка ком",
                "end_session": false
            },
            "version": "1.0"
        });
    }
    if (command !== 'PING') console.log(command);
    const data = cache.get(command);
    if (data) {
        return reply.send(data);
    }
    fastify.pg.query(
        'SELECT * FROM movies WHERE weighted_tsv @@ plainto_tsquery(\'russian\', \'' + command.replace(/'/ig, '') + '\') AND embeds != \'[]\' LIMIT 10',
        (err, result) => {
            if (err || !result|| !result.rows || !result.rows.length) {
                console.log(err);
                let data = {
                    "response": {
                        "text": "😔 К сожалению, плеера видео нет.\n\n\n😏 Попробуйте поискать что-то еще.\n\n\n🥺 Я исправлюсь, обещаю!",
                        "tts": "К сожалению, плеера видео нет. Попробуйте поискать что-то еще. Я исправлюсь, обещаю!",
                        "end_session": false
                    },
                    "version": "1.0"
                };
                cache.set(command, data);
                return reply.send(data);
            } else {
                let data = {
                    "response": {
                        "text": "🎬 Нажмите на ссылку и плеер откроется:",
                        "tts": "Нажмите на ссылку и плеер откроется:",
                        "buttons": result.rows.map(function (m) {return {
                            "title": '👉 ' + (m.title_ru || m.title_en) + ' (' + m.year + ') смотреть онлайн',
                            "url": 'https://pleer.video/' + m.kp_id + '.html',
                            "hide": false
                        }}),
                        "end_session": false
                    },
                    "version": "1.0"
                };
                cache.set(command, data);
                return reply.send(data);
            }
        });
});

fastify.listen(23456);

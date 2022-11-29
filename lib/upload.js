const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool();
const async = require('async');
let ivi = fs.existsSync('./public/movies.json') ? require('./public/movies') : null;

if (!ivi || !ivi.xml || !ivi.xml.contents || !ivi.xml.contents.content.length) return process.exit(0);

let movies = [{results: []}];
let movies_xml = [{results: []}];
let movies_turbo = [{results: []}];
let movies_related = {};
let mr = [];
let series = [{results: []}];
let series_xml = [{results: []}];
let series_turbo = [{results: []}];
let series_related = {};
let sr = [];

movies_related[1009784] = '<link url="https://pleer.video/1009784.html">Фильм «Апгрейд» смотреть онлайн</link>';
movies_related[81297] = '<link url="https://pleer.video/81297.html">Фильм «Малышка на миллион» смотреть онлайн</link>';
movies_related[839954] = '<link url="https://pleer.video/839954.html">Фильм «Легенда» смотреть онлайн</link>';
movies_related[86326] = '<link url="https://pleer.video/86326.html">Фильм «Счастливое число Слевина» смотреть онлайн</link>';
movies_related[406408] = '<link url="https://pleer.video/406408.html">Фильм «Законопослушный гражданин» смотреть онлайн</link>';
movies_related[681849] = '<link url="https://pleer.video/681849.html">Фильм «Лучшее предложение» смотреть онлайн</link>';
movies_related[424266] = '<link url="https://pleer.video/424266.html">Фильм «Книга Илая» смотреть онлайн</link>';
movies_related[260162] = '<link url="https://pleer.video/260162.html">Фильм «Далласский клуб покупателей» смотреть онлайн</link>';
movies_related[977288] = '<link url="https://pleer.video/977288.html">Фильм «Поезд в Пусан» смотреть онлайн</link>';
movies_related[462606] = '<link url="https://pleer.video/462606.html">Фильм «Области тьмы» смотреть онлайн</link>';
movies_related[808639] = '<link url="https://pleer.video/808639.html">Фильм «Дурак» смотреть онлайн</link>';
movies_related[535341] = '<link url="https://pleer.video/535341.html">Фильм «1+1» смотреть онлайн</link>';
movies_related[842037] = '<link url="https://pleer.video/842037.html">Фильм «Я худею» смотреть онлайн</link>';
movies_related[467293] = '<link url="https://pleer.video/467293.html">Фильм «Грязь» смотреть онлайн</link>';
movies_related[468102] = '<link url="https://pleer.video/468102.html">Фильм «О чем говорят мужчины» смотреть онлайн</link>';
movies_related[461939] = '<link url="https://pleer.video/461939.html">Фильм «Линкольн для адвоката» смотреть онлайн</link>';
movies_related[635772] = '<link url="https://pleer.video/635772.html">Фильм «Игра в имитацию» смотреть онлайн</link>';
movies_related[419200] = '<link url="https://pleer.video/419200.html">Фильм «Пипец» смотреть онлайн</link>';
movies_related[195615] = '<link url="https://pleer.video/195615.html">Фильм «Механик» смотреть онлайн</link>';
movies_related[276598] = '<link url="https://pleer.video/276598.html">Фильм «Драйв» смотреть онлайн</link>';

series_related = JSON.parse(JSON.stringify(movies_related));

let global_contents_kp = [];

let global_contents = {};
for (let i = 0, l = ivi.xml.contents.content.length; i < l; i++) {
    if (typeof ivi.xml.contents.content[i] !== 'object' || !ivi.xml.contents.content[i].kinopoisk_id) continue;
    global_contents_kp.push(ivi.xml.contents.content[i]);
    if (global_contents[ivi.xml.contents.content[i].kinopoisk_id]) {
        global_contents[ivi.xml.contents.content[i].kinopoisk_id].push(ivi.xml.contents.content[i]);
    } else {
        global_contents[ivi.xml.contents.content[i].kinopoisk_id] = [ivi.xml.contents.content[i]];
    }
}

global_contents_kp.sort(function(a,b) {
    return new Date(b.date_insert) - new Date(a.date_insert) ||
        ((b.season && parseInt(b.season)) || 1) - ((a.season && parseInt(a.season)) || 1) ||
        ((b.episode && parseInt(b.episode)) || 1) - ((a.episode && parseInt(a.episode)) || 1);
}).forEach(function (content) {
    if (movies[movies.length-1].results.length > 99) {
        movies[movies.length] = {results: []};
        movies_xml[movies_xml.length] = {results: []};
        movies_turbo[movies_turbo.length] = {results: []};
    }
    if (series[series.length-1].results.length > 99) {
        series[series.length] = {results: []};
        series_xml[series_xml.length] = {results: []};
        series_turbo[series_turbo.length] = {results: []};
    }

    let kp_id = parseInt(content.kinopoisk_id || '0');
    let type = (content.season || content.episode) ? 1 : 0;

    if (type === 1 && Object.keys(series_related).length < 30) {
        series_related[kp_id] = '<link url="https://pleer.video/' + kp_id + '.html">' + (type ? 'Сериал «' : 'Фильм «') + (content.compilation || content.title || '') + '» смотреть онлайн</link>';
    }

    if (type === 0 && Object.keys(movies_related).length < 30) {
        movies_related[kp_id] = '<link url="https://pleer.video/' + kp_id + '.html">' + (type ? 'Сериал «' : 'Фильм «') + (content.compilation || content.title || '') + '» смотреть онлайн</link>';
    }

    if (type) {
        if (series[series.length-1].results.length <= 99 && sr.indexOf(kp_id) === -1) {
            let s = (content.season && parseInt(content.season)) || 1;
            let e = (content.episode && parseInt(content.episode)) || 1;
            let year = '';
            let year_begin = content.release_dates && content.release_dates.release_date && content.release_dates.release_date.release_date_begin
                ? parseInt(content.release_dates.release_date.release_date_begin)
                : content.release_dates && content.release_dates.release_date && content.release_dates.release_date[0] && content.release_dates.release_date[0].release_date_begin
                    ? parseInt(content.release_dates.release_date[0].release_date_begin)
                    : 0;
            let year_end = content.release_dates && content.release_dates.release_date && content.release_dates.release_date.release_date_end
                ? parseInt(content.release_dates.release_date.release_date_end)
                : content.release_dates && content.release_dates.release_date && content.release_dates.release_date[0] && content.release_dates.release_date[0].release_date_end
                    ? parseInt(content.release_dates.release_date[0].release_date_end)
                    : year_begin;
            if (year_begin && year_end && year_begin !== year_end) {
                year = ' ' + year_begin + '-' + year_end + '';
            } else if (year_begin && year_begin === year_end) {
                year = ' ' + year_begin + '';
            } else if (content.release_date && content.release_date.indexOf('-') + 1) {
                year = ' ' + parseInt(content.release_date.split('-')[0]) + '';
            }
            let title_limit = 0;
            let title = ((content.compilation || content.title || '') + ' сериал' + year + ' смотреть онлайн бесплатно в хорошем качестве HD ' + [...Array(s).keys()].map((i) => ++i).join(',') + ' сезон ' + [...Array(e).keys()].map((i) => ++i).join(',') + ' серия').trim();
            let title_min = title.length > 220 ? ((content.compilation || content.title || '') + ' сериал' + year + ' смотреть онлайн бесплатно в хорошем качестве HD ' + (s > 1 ? '1-' + s : s) + ' сезон ' + (e > 1 ? '1-' + e : e) + ' серия').trim() : title;
            let tags_limit = 0;
            let tags = content.about && content.about.item
                ? typeof content.about.item === 'string'
                    ? content.about.item
                    : content.about.item.join(',')
                : '';
            let tags_min = content.about && content.about.item
                ? typeof content.about.item === 'string'
                    ? content.about.item
                    : content.about.item.filter(item => (tags_limit += (item.replace(/<(.|\n)*?>/g, '')
                        .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                        .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                        .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                        .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                        .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                        .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                        .replace(/&lt;/g, '<').replace(/</g, '&lt;').length+1)) && tags_limit <= 130).join(',')
                : '';
            let description_limit = 0;
            let description = (content.descr || (title + ' ' + tags)).trim();
            title = title
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;');
            title_min = title_min
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;')
                .split(' ').filter(item => (title_limit += (item.length+1)) && title_limit <= 220).join(' ');
            tags = tags
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;');
            tags_min = tags_min
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;');
            description = description
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;');
            series[series.length-1].results.push({
                kp_id: kp_id,
                season: s,
                episode: e,
                date: content.date_insert,
                json: 'https://pleer.video/' + kp_id + '.json',
                iframe: 'https://pleer.video/' + kp_id + '#S' + s + 'E' + e
            });
            series_xml[series_xml.length-1].results.push('' +
                '<url>' +
                '<loc>https://pleer.video/' + kp_id + '.html</loc>' +
                '<video:video>' +
                '<video:thumbnail_loc>https://pleer.video/' + kp_id + '.jpg</video:thumbnail_loc>' +
                '<video:title>' + title_min + '</video:title>' +
                '<video:description>' + description.split(' ').filter(item => (description_limit += (item.length+1)) && description_limit <= 1050).join(' ') + (description_limit > 1050 ? '...' : '') + '</video:description>' +
                '<video:player_loc>https://pleer.video/' + kp_id + '</video:player_loc>' +
                '<video:duration>' + (content.duration || 2689) + '</video:duration>' +
                '<video:family_friendly>yes</video:family_friendly>' +
                '<video:live>no</video:live>' +
                '<video:tag>' + tags_min + '</video:tag>' +
                '</video:video>' +
                '<image:image>' +
                '<image:loc>https://pleer.video/' + kp_id + '.jpg</image:loc>' +
                '<image:title>' + title_min + '</image:title>' +
                '</image:image>' +
                '</url>');
            series_turbo[series_turbo.length-1].results.push('' +
                '<item turbo="true">' +
                '<link>https://pleer.video/' + kp_id + '.html</link>' +
                '<category>' + tags + '</category>' +
                '<turbo:content>' +
                '<![CDATA[' +
                '<header>' +
                '<h1>' + title_min + '</h1>' +
                '<figure>' +
                '<img src="https://pleer.video/' + kp_id + '.jpg">' +
                '</figure>' +
                '</header>' +
                (((content.kinopoisk_rating && parseInt(content.kinopoisk_rating)) || (content.imdb_rating && parseInt(content.imdb_rating))) ? ('<div itemscope itemtype="http://schema.org/Rating">' +
                '<meta itemprop="ratingValue" content="' + ((content.kinopoisk_rating && parseInt(content.kinopoisk_rating)) || (content.imdb_rating && parseInt(content.imdb_rating))) + '">' +
                '<meta itemprop="bestRating" content="10">' +
                '</div>') : '') +
                '<p>' + (content.descr || ('<p>' + title + '</p>' + ' ' + '<p>' + tags + '</p>')) + '</p>' +
                '<button formaction="https://pleer.video/' + kp_id + '.html" data-background-color="#2b213a" data-color="white" data-primary="true">Смотреть онлайн</button>' +
                '<button formaction="https://pleer.video" data-background-color="#161822" data-color="white" data-primary="true">API фильмов и сериалов</button>' +
                ']]>' +
                '</turbo:content>' +
                '</item>');
            sr.push(kp_id);
        }
    } else {
        if (movies[movies.length-1].results.length <= 99 && mr.indexOf(kp_id) === -1) {
            movies[movies.length-1].results.push({
                kp_id: kp_id,
                date: content.date_insert,
                json: 'https://pleer.video/' + kp_id + '.json',
                iframe: 'https://pleer.video/' + kp_id
            });
            let year = '';
            let year_begin = content.release_dates && content.release_dates.release_date && content.release_dates.release_date.release_date_begin
                ? parseInt(content.release_dates.release_date.release_date_begin)
                : content.release_dates && content.release_dates.release_date && content.release_dates.release_date[0] && content.release_dates.release_date[0].release_date_begin
                    ? parseInt(content.release_dates.release_date[0].release_date_begin)
                    : 0;
            let year_end = content.release_dates && content.release_dates.release_date && content.release_dates.release_date.release_date_end
                ? parseInt(content.release_dates.release_date.release_date_end)
                : content.release_dates && content.release_dates.release_date && content.release_dates.release_date[0] && content.release_dates.release_date[0].release_date_end
                    ? parseInt(content.release_dates.release_date[0].release_date_end)
                    : year_begin;
            if (year_begin && year_end && year_begin !== year_end) {
                year = ' ' + year_begin + '-' + year_end + '';
            } else if (year_begin && year_begin === year_end) {
                year = ' ' + year_begin + '';
            } else if (content.release_date && content.release_date.indexOf('-') + 1) {
                year = ' ' + parseInt(content.release_date.split('-')[0]) + '';
            }
            let title_limit = 0;
            let title = ((content.compilation || content.title || '') + ' фильм' + year + ' смотреть онлайн бесплатно в хорошем качестве HD').trim();
            let title_min = title;
            let tags_limit = 0;
            let tags = content.about && content.about.item
                ? typeof content.about.item === 'string'
                    ? content.about.item
                    : content.about.item.join(', ')
                : '';
            let tags_min = content.about && content.about.item
                ? typeof content.about.item === 'string'
                    ? content.about.item
                    : content.about.item.filter(item => (tags_limit += (item.replace(/<(.|\n)*?>/g, '')
                        .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                        .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                        .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                        .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                        .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                        .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                        .replace(/&lt;/g, '<').replace(/</g, '&lt;').length+1)) && tags_limit <= 130).join(',')
                : '';
            let description_limit = 0;
            let description = (content.descr || (title + ' ' + tags)).trim();
            title = title
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;');
            title_min = title_min
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;')
                .split(' ').filter(item => (title_limit += (item.length+1)) && title_limit <= 220).join(' ');
            tags = tags
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;');
            tags_min = tags_min
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;');
            description = description
                .replace(/<(.|\n)*?>/g, '')
                .replace(/\\r/g, ' ').replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '')
                .replace(/&amp;/g, '&').replace(/&/g, '&amp;')
                .replace(/&apos;/g, '\'').replace(/'/g, '&apos;')
                .replace(/&quot;/g, '"').replace(/"/g, '&quot;')
                .replace(/&gt;/g, '>').replace(/>/g, '&gt;')
                .replace(/&lt;/g, '<').replace(/</g, '&lt;');
            movies_xml[movies_xml.length-1].results.push('' +
                '<url>' +
                '<loc>https://pleer.video/' + kp_id + '.html</loc>' +
                '<video:video>' +
                '<video:thumbnail_loc>https://pleer.video/' + kp_id + '.jpg</video:thumbnail_loc>' +
                '<video:title>' + title_min + '</video:title>' +
                '<video:description>' + description.split(' ').filter(item => (description_limit += (item.length+1)) && description_limit <= 1050).join(' ') + (description_limit > 1050 ? '...' : '') + '</video:description>' +
                '<video:player_loc>https://pleer.video/' + kp_id + '</video:player_loc>' +
                '<video:duration>' + (content.duration || 8828) + '</video:duration>' +
                '<video:family_friendly>yes</video:family_friendly>' +
                '<video:live>no</video:live>' +
                '<video:tag>' + tags_min + '</video:tag>' +
                '</video:video>' +
                '<image:image>' +
                '<image:loc>https://pleer.video/' + kp_id + '.jpg</image:loc>' +
                '<image:title>' + title_min + '</image:title>' +
                '</image:image>' +
                '</url>');
            movies_turbo[movies_turbo.length-1].results.push('' +
                '<item turbo="true">' +
                '<link>https://pleer.video/' + kp_id + '.html</link>' +
                '<category>' + tags + '</category>' +
                '<turbo:content>' +
                '<![CDATA[' +
                '<header>' +
                '<h1>' + title_min + '</h1>' +
                '<figure>' +
                '<img src="https://pleer.video/' + kp_id + '.jpg">' +
                '</figure>' +
                '</header>' +
                (((content.kinopoisk_rating && parseInt(content.kinopoisk_rating)) || (content.imdb_rating && parseInt(content.imdb_rating))) ? ('<div itemscope itemtype="http://schema.org/Rating">' +
                    '<meta itemprop="ratingValue" content="' + ((content.kinopoisk_rating && parseInt(content.kinopoisk_rating)) || (content.imdb_rating && parseInt(content.imdb_rating))) + '">' +
                    '<meta itemprop="bestRating" content="10">' +
                    '</div>') : '') +
                '<p>' + (content.descr || ('<p>' + title + '</p>' + ' ' + '<p>' + tags + '</p>')) + '</p>' +
                '<button formaction="https://pleer.video/' + kp_id + '.html" data-background-color="#2b213a" data-color="white" data-primary="true">Смотреть онлайн</button>' +
                '<button formaction="https://pleer.video" data-background-color="#161822" data-color="white" data-primary="true">API фильмов и сериалов</button>' +
                ']]>' +
                '</turbo:content>' +
                '</item>');
            mr.push(kp_id);
        }
    }
});

let movies_index = [];
let ml = movies.length;
console.log('Movies:', ml, 'pages');
async.eachOfLimit(movies, 1, function (movie, index, callback) {
    let channel = '<title>Смотреть фильмы бесплатно, открытое API легальных онлайн плееров</title><link>http://pleer.video</link><description>Смотреть фильмы бесплатно, открытое API легальных онлайн плееров</description><yandex:related type="infinity">' + Object.keys(movies_related).map(id => movies_related[id]).join('') + '</yandex:related>';
    let current = (index + 1);
    movie.pages = {
        current: index ? index + 1 : 1,
        last: ml,
        url: {}
    };
    if (current > 1) {
        movie.pages.url.prev = 'https://pleer.video/movies' + (current - 1) + '.json';
    }
    if (current < ml) {
        movie.pages.url.next = 'https://pleer.video/movies' + (current + 1) + '.json';
    }
    if (!index) {
        fs.writeFile('./public/movies.json', JSON.stringify(movie, null, 2), function (err) {
            fs.writeFile('./public/movies1.json', JSON.stringify(movie, null, 2), function (err) {
                fs.writeFile('./public/movies1.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">' + movies_xml[index].results.join('') + '</urlset>', function (err) {
                    movies_index.push('<sitemap><loc>https://pleer.video/movies1.xml</loc></sitemap>');
                    fs.writeFile('./public/movies-RSS1.xml', '<rss xmlns:yandex="http://news.yandex.ru" xmlns:media="http://search.yahoo.com/mrss/" xmlns:turbo="http://turbo.yandex.ru" version="2.0"><channel>' + channel + movies_turbo[index].results.join('') + '</channel></rss>', function (err) {
                        callback(err);
                    });
                });
            });
        });
    } else {
        console.log('movies', current);
        fs.writeFile('./public/movies' + current + '.json', JSON.stringify(movie, null, 2), function (err) {
            fs.writeFile('./public/movies' + current + '.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">' + movies_xml[index].results.join('') + '</urlset>', function (err) {
                movies_index.push('<sitemap><loc>https://pleer.video/movies' + current + '.xml</loc></sitemap>');
                fs.writeFile('./public/movies-RSS' + current + '.xml', '<rss xmlns:yandex="http://news.yandex.ru" xmlns:media="http://search.yahoo.com/mrss/" xmlns:turbo="http://turbo.yandex.ru" version="2.0"><channel>' + channel + movies_turbo[index].results.join('') + '</channel></rss>', function (err) {
                    callback(err);
                });
            });
        });
    }
}, function (err) {
    if (err) console.error(err);
    fs.writeFile('./public/movies.xml', '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + movies_index.join('') + '</sitemapindex>', function (err) {
    });
    movies = null;
});

let series_index = [];
let sl = series.length;
console.log('Series:', sl, 'pages');
async.eachOfLimit(series, 1, function (ser, index, callback) {
    let channel = '<title>Смотреть сериалы бесплатно, открытое API легальных онлайн плееров</title><link>http://pleer.video</link><description>Смотреть сериалы бесплатно, открытое API легальных онлайн плееров</description><yandex:related type="infinity">' + Object.keys(series_related).map(id => series_related[id]).join('') + '</yandex:related>';
    let current = (index + 1);
    ser.pages = {
        current: index ? index + 1 : 1,
        last: sl,
        url: {}
    };
    if (current > 1) {
        ser.pages.url.prev = 'https://pleer.video/episodes' + (current - 1) + '.json';
    }
    if (current < sl) {
        ser.pages.url.next = 'https://pleer.video/episodes' + (current + 1) + '.json';
    }
    if (!index) {
        fs.writeFile('./public/episodes.json', JSON.stringify(ser, null, 2), function (err) {
            fs.writeFile('./public/episodes1.json', JSON.stringify(ser, null, 2), function (err) {
                fs.writeFile('./public/episodes1.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">' + series_xml[index].results.join('') + '</urlset>', function (err) {
                    series_index.push('<sitemap><loc>https://pleer.video/episodes1.xml</loc></sitemap>');
                    fs.writeFile('./public/episodes-RSS1.xml', '<rss xmlns:yandex="http://news.yandex.ru" xmlns:media="http://search.yahoo.com/mrss/" xmlns:turbo="http://turbo.yandex.ru" version="2.0"><channel>' + channel + series_turbo[index].results.join('') + '</channel></rss>', function (err) {
                        callback(err);
                    });
                });
            });
        });
    } else {
        console.log('episodes', current);
        fs.writeFile('./public/episodes' + current + '.json', JSON.stringify(ser, null, 2), function (err) {
            fs.writeFile('./public/episodes' + current + '.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">' + series_xml[index].results.join('') + '</urlset>', function (err) {
                series_index.push('<sitemap><loc>https://pleer.video/episodes' + current + '.xml</loc></sitemap>');
                fs.writeFile('./public/episodes-RSS' + current + '.xml', '<rss xmlns:yandex="http://news.yandex.ru" xmlns:media="http://search.yahoo.com/mrss/" xmlns:turbo="http://turbo.yandex.ru" version="2.0"><channel>' + channel + series_turbo[index].results.join('') + '</channel></rss>', function (err) {
                    callback(err);
                });
            });
        });
    }
}, function (err) {
    if (err) console.error(err);
    fs.writeFile('./public/episodes.xml', '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + series_index.join('') + '</sitemapindex>', function (err) {
    });
    series = null;
});

global_contents_kp = null;
ivi = null;

let ids = [];
let n = 0;

async.eachOfLimit(Object.keys(global_contents), 1, function (kp_id, index, callback) {

    ids.push(kp_id);

    let embeds = [];

    async.eachOfLimit(global_contents[kp_id].sort(function(a,b) {
        return new Date(b.date_insert) - new Date(a.date_insert) ||
            ((b.season && parseInt(b.season)) || 1) - ((a.season && parseInt(a.season)) || 1) ||
            ((b.episode && parseInt(b.episode)) || 1) - ((a.episode && parseInt(a.episode)) || 1);
    }), 1, function (content, index, callback) {
        let ivi_id = parseInt(content.id || '0');
        let type = (content.season || content.episode) ? 1 : 0;

        if (type) {
            var s = (content.season && parseInt(content.season)) || 1;
            var e = (content.episode && parseInt(content.episode)) || 1;
            embeds.push({
                ivi_id: ivi_id,
                season: s,
                episode: e,
                right_date_begin: content.date_insert || '',
                right_date_end: content.right_date_end || '',
                right_type: content.right_type || '',
                iframe: 'https://pleer.video/' + kp_id + '#S' + s + 'E' + e
            });
            embeds = embeds.sort(function(a,b) {
                return b.season - a.season || b.episode - a.episode;
            });
        } else {
            embeds.push({
                ivi_id: ivi_id,
                right_date_begin: content.date_insert || '',
                right_date_end: content.right_date_end || '',
                right_type: content.right_type || '',
                iframe: 'https://pleer.video/' + kp_id
            });
        }

        callback();
    }, function (err) {
        if (err) console.error(err);

        pool.query("UPDATE movies SET embeds=($1) WHERE kp_id=($2);", [JSON.stringify(embeds), parseInt(kp_id)], (err, res) => {
            console.log(index + '/' + Object.keys(global_contents).length + ')', kp_id, err || '');
            n++;
        });

        callback();
    });
}, function (err) {
    if (err) console.error(err);
    fs.appendFile('./public/ids.json', JSON.stringify(ids), function (err) {
        if (err) console.log(err);
        console.log('IDs:', ids.join(','));
    });
    setInterval(function () {
        console.log('---------------------' + n + '---------------------');
        if (n >= Object.keys(global_contents).length) {
            pool.end();
            process.exit(0);
        }
    }, 10000);
});
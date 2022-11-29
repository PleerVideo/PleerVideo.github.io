// mkdir -p public; npm init -y; npm i async; node index.js

const fs = require('fs');
const async = require('async');
const https = require('https');

let intervalId;
let start_time = new Date();
let ids = {};
let num = 1;
ids[num] = {};

function save(s) {
    let num_keys = Object.keys(ids);
    num_keys.forEach(function (n) {
        let ids_keys = Object.keys(ids[n]);
        if (ids_keys.length >= 10000 || s === 1) {
            try {
                fs.appendFileSync('./public/' + n + '.json', JSON.stringify(ids[n]));
                console.log('SAVE:', n + '.json', 'LAST ID:', ids_keys[ids_keys.length - 1]);
                delete ids[n];
            } catch (err) {
                console.log(err);
            }
        } else {
            console.log('NOT SAVE:', n + '.json', 'LAST ID:', ids_keys[ids_keys.length - 1], 'NUM IDs:', ids_keys.length, 'TIME:', (new Date()) - start_time, 'ms');
        }
    });
    if (((new Date()) - start_time) > 900000 && s !== 1) {
        clearInterval(intervalId);
        save(1);
        console.timeEnd('DONE');
        setTimeout(function () {
            return process.exit(0);
        }, 10000);
    }
}

console.time('DONE');

intervalId = setInterval(save, 10000);

const loop1 = JSON.parse(JSON.stringify(Array.from(Array(1300).keys())));
const loop2 = JSON.parse(JSON.stringify(Array.from(Array(1000).keys())));

async.eachOfLimit(loop1, 15, function (key, index, callback) {
    if (key < 1200) return callback();
    async.eachOfLimit(loop2, 1000, function (key2, index, callback) {
        const id = key * 1000 + key2;
        const request = https
            .get('https://st.kp.yandex.net/images/film_iphone/iphone360_' + id + '.jpg', response => {
                    if (response.statusCode === 301 || response.statusCode === 302) {
                        if (response.headers.location !== 'https://st.kp.yandex.net/images/no-poster.gif') {
                            if (ids[num]) {
                                ids[num][id] = response.headers.location;
                            }
                            if (Object.keys(ids[num]).length >= 10000) {
                                num = num + 1;
                                ids[num] = {};
                            }
                        }
                    }
                    try {
                        callback();
                    } catch (e) {}
                }
            )
            .on('error', err => {
                if (err) console.log(err);
                try {
                    callback();
                } catch (e) {}
            });
        request.setTimeout(5000,function (err) {
            if (err) console.log(err);
            try {
                callback();
            } catch (e) {}
        });
    }, function (e) {
        callback();
    });
}, function (e) {
    clearInterval(intervalId);
    save(1);
    console.timeEnd('DONE');
    setTimeout(function () {
        return process.exit(0);
    }, 10000);
});
const fs = require('fs');
const async = require('async');
const http = require('http');
const https = require('https');
const sizeOf = require('image-size');
const { Pool } = require('pg');
const pool = new Pool();

let intervalId;
let start_time = new Date();
let ids = {};
let num = 1;
ids[num] = {};

function save(s) {
    let num_keys = Object.keys(ids);
    num_keys.forEach(function (n) {
        let ids_keys = Object.keys(ids[n]);
        if (ids_keys.length >= 5000 || s === 1) {
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

const loop1 = JSON.parse(JSON.stringify(Array.from(Array(60).keys())));

async.eachOfLimit(loop1, 1, function (key, index2, callback) {
    if (key < 30) return callback();
    const offset = key * 1000;
    pool.query('SELECT kp_id, pictures FROM movies WHERE pictures != \'\' ORDER BY kp_id LIMIT 1000 OFFSET ' + offset + ';', (err, res) => {
        if (err || !res || !res.rows || !res.rows.length) {
            console.error(offset, err);
            return process.nextTick(function () {
                try {
                    callback();
                } catch (e) {}
            });
        }
        async.eachOfLimit(res.rows, 1000, function (row, index1, callback) {
            let pics = row.pictures.split(',');
            let pic_save = false;
            let id = parseInt(row.kp_id || 0);
            async.eachOfLimit(pics, 1, function (pic, index, callback) {
                if (pic_save) {
                    return process.nextTick(function () {
                        try {
                            callback();
                        } catch (e) {}
                    });
                }
                const request = http
                    .get('http://st.kp.yandex.net/images/kadr/' + pic.trim() + '.jpg?img=1', response => {
                            if (response.statusCode === 200 || response.statusCode === 304) {
                                var buffer = new Buffer([]);
                                var dimensions;
                                var imageTypeDetectionError;

                                response
                                    .on('data', function(chunk) {
                                        buffer = Buffer.concat([buffer, chunk]);
                                        try {
                                            dimensions = sizeOf(buffer);
                                        } catch (e) {
                                            imageTypeDetectionError = e;
                                            return;
                                        }
                                        request.destroy();
                                    })
                                    .on('error', function(err) {
                                        if (err) console.log(err);
                                        process.nextTick(function () {
                                            try {
                                                callback();
                                            } catch (e) {}
                                        });
                                    })
                                    .on('end', function() {
                                        if (dimensions && typeof dimensions.width !== 'undefined' && typeof dimensions.height !== 'undefined') {
                                            if (dimensions.height > dimensions.width) {
                                                if (index < (pics.length - 1)) {
                                                    console.log(pics.join(','), dimensions.height + 'x' + dimensions.width, 'https://st.kp.yandex.net/images/kadr/' + pic.trim() + '.jpg');
                                                    return process.nextTick(function () {
                                                        try {
                                                            callback();
                                                        } catch (e) {}
                                                    });
                                                }
                                            }
                                        }
                                        if (ids[num]) {
                                            pic_save = true;
                                            ids[num][id] = 'https://st.kp.yandex.net/images/kadr/' + pic.trim() + '.jpg';
                                        }
                                        if (Object.keys(ids[num]).length >= 5000) {
                                            num = num + 1;
                                            ids[num] = {};
                                        }
                                        process.nextTick(function () {
                                            try {
                                                callback();
                                            } catch (e) {}
                                        });
                                    });
                            } else {
                                console.log('PICTURE NOT FOUND', pics.join(','), 'http://st.kp.yandex.net/images/kadr/' + pic.trim() + '.jpg');
                                process.nextTick(function () {
                                    try {
                                        callback();
                                    } catch (e) {}
                                });
                            }
                        }
                    )
                    .on('error', err => {
                        if (err) console.log(err);
                        process.nextTick(function () {
                            try {
                                callback();
                            } catch (e) {}
                        });
                    });
                request.setTimeout(1200000,function (err) {
                    if (err) console.log(err);
                    process.nextTick(function () {
                        try {
                            callback();
                        } catch (e) {}
                    });
                });
            }, function (err) {
                process.nextTick(function () {
                    try {
                        callback();
                    } catch (e) {}
                });
            });
        }, function (e) {
            process.nextTick(function () {
                try {
                    callback();
                } catch (e) {}
            });
        });
    });
}, function (e) {
    clearInterval(intervalId);
    save(1);
    console.timeEnd('DONE');
    setTimeout(function () {
        return process.exit(0);
    }, 10000);
});

const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool();
const async = require('async');

var ids = process.argv.slice(2);

if (!ids[0]) process.exit(0);

async.eachOfLimit([ids[0]], 1, function (type, index, callback) {
    fs.readdir('/home/pleer.video/' + type, (err, files) => {
        async.eachOfLimit((ids[1] ? [ids[1]] : files), 1, function (file, index, callback) {
            let kp_id = parseInt(file.replace(/[^0-9]/g, '') || 0);
            if (!kp_id) return callback();
            pool.query('UPDATE movies SET ' + type + '=($1) WHERE kp_id=($2);', [1, kp_id], (err, res) => {
                console.log(kp_id);
                callback(err);
            });
        }, function (err) {
            callback(err);
        });
    });
}, function (err) {
    if (err) console.error(err);
    pool.end();
    process.exit(0);
});

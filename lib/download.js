const fs = require('fs');
const request = require('request');
const options = {
    url: 'http://xml.digitalaccess.ru/api/json/',
    method: 'POST',
    json: {"params": [{"subsite_id": "3100"}], "method": "da.tasks.content_xml_write.create"},
    auth: {
        user: 'common_subsite_xml',
        pass: 'm5r9Ci8g7d',
        sendImmediately: false
    }
};
request(options, function (error, response, body) {
    if (body && body.error && (body.error.code === 5203 || body.error.code === 5200)) {
        console.log('ERROR', body);
    }
    composed(function (err) {
        if (err) return process.exit(1);
        console.log('DONE');
        return process.exit(0);
    });
});

function composed(callback) {
    options.json.method = 'da.tasks.xml_content_site_read.prepare';
    request(options, function (error, response, body) {
        console.log(error, response && response.statusCode);
        if (body && body.error && (body.error.code === 5203 || body.error.code === 5200)) {
            console.log('ERROR2', body);
            callback(1);
        } else {
            if (!body || !body.result || !body.result.xml) {
                console.log('ERROR3', body);
                return callback(1);
            }
            request
                .get(body.result.xml)
                .on('error', function(error) {
                    console.error(error);
                    callback(1);
                })
                .pipe(fs.createWriteStream('./public/ivi.xml'))
                .on('close', function() {
                    console.log('CLOSE');
                    callback();
                });
        }
    });
}
var request = require('request');

module.exports.getRequest = function (options,onResponse){
    options.server.listen(options.port, function () {
        request.get({
            uri: options.uri,
            followRedirect: false,
            headers: options.headers
        }, onResponse);
    });
};
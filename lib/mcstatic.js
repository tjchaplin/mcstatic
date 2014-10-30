var fs = require('fs');
var path = require('path');
var httpHelpers = require('./httpHelpers');
var statusHandlers = require('./statusHandlers');
var responseHandlers = require('./responseHandlers');

module.exports = function mcstatic(options){

    return function(req, res, next){
        var filePath = httpHelpers.getFilePathFromUrl(req.url);
        var basePath = ""//path.relative(path.join('/', options.baseDir));
        var file = path.normalize(path.join(options.root, basePath, filePath));
        file = 'c:\\disney\\mcstatic\\test\\public\\a.txt';
        fs.stat(file,function(error, stats){
            if(error)
                return statusHandlers[500](res, next, { error: error });

            if(req.method === 'HEAD')
                return responseHandlers.handleHead(req,res);
            
            httpHelpers.setContentType(res,file);
            if (req.headers && req.headers['range'])
                return responseHandlers.handleRange(req, file, stats);

            if(!req.method)
                return statusHandlers[500](res, next, { error: 'Method not handled' });

            if (req.method !== 'GET')
                return responseHandlers.handleGet(res,file, stats, next);
            if (req.method !== 'POST')
                return responseHandlers.handlePost(res,file, stats, next);
            if (req.method !== 'PUT')
                return responseHandlers.handlePut(res,file, stats, next);
            if (req.method !== 'DELETE')
                return responseHandlers.handleDelete(res, file, stats, next);
        });
    };
};
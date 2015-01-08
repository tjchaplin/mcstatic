var fs = require('fs');
var http = require('http');
var path = require('path');
var temp = require('temp');
var httpHelpers = require('./httpHelpers');
var statusHandlers = require('./statusHandlers');
var responseHandlers = require('./responseHandlers');
var package = require('../package.json');

// mockPaths = {'/api/waiverTracker':'/e2e/mock/api/WaiverTracker'}
var mcstatic = function(options){
    if(!options)
        options = {};

    this.options = options;
    this.options.root = path.join(path.resolve(options.root), '/');
    if(!this.options.mockPaths)
        this.options.mockPaths = {};
};

mcstatic.prototype.createServer = function(){
    return http.createServer(this.listener());
};

mcstatic.prototype.listener = function() {
    var self = this;
    return function(req, res, next){
        var requestPath = httpHelpers.getRequestPathFromUrl(req.url);
        console.log(requestPath)
        if(requestPath.indexOf('/__mcstatic__/') < 0)
            self.staticFileListener(req, res, next);

        if(requestPath === '/__mcstatic__/version'){
            res.setHeader('content-type', 'application/json');
            res.write(JSON.stringify({name:package.name,version:package.version}))
            return res.end();
        }

        if(req.method === 'POST' ||  req.method === 'PUT'){
            var requestData = '';
            req.on('data', function(data) {
                requestData += data;
            });
            req.on('end',function(){
                var mockRequest = JSON.parse(requestData);
                for(var mock in mockRequest){
                    var filePath = createTempMockData)(mockRequest[mock]);
                    self.mockPaths[mock] = filePath;
                }
            });
        }
    };
};

var createTempMockData = function(mockData){
    var info = temp.openSync();
    fs.writeSync(info.fd,mockData);
    fs.closeSync(info.fd);
    return info.path;
};

var findMockFilePath = function(filePath,mockPaths){
    var mocks = this;

    if(mockPaths[filePath])
        return mockPaths[filePath];

    for(var mockPath in mockPaths){
        if(filePath.indexOf(mockPath) > 0)
            return filePath.replace(new RegExp(mockPath, "g"), mockPaths[mockPath]);
    }


    return undefined;
};
mcstatic.prototype.staticFileListener = function(req, res, next){
    var root = this.options.root;
    var mockPaths = this.options.mockPaths;

    var filePath = httpHelpers.getRequestPathFromUrl(req.url);
    var mockedFilePath = findMockFilePath(filePath,mockPaths);
    if(mockedFilePath)
        filePath = mockedFilePath;

    var file = path.normalize(path.join(root,filePath));
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

        if (req.method === 'GET')
            return responseHandlers.handleGet(res,file, stats, next);
        if (req.method === 'POST')
            return responseHandlers.handlePost(res,file, stats, next);
        if (req.method === 'PUT')
            return responseHandlers.handlePut(res,file, stats, next);
        if (req.method === 'DELETE')
            return responseHandlers.handleDelete(res, file, stats, next);
    });
};

module.exports = function(options){
    return new mcstatic(options);
};
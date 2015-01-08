var fs = require('fs');
var http = require('http');
var path = require('path');
var request = require('request');
var temp = require('temp').track();
var httpHelpers = require('./httpHelpers');
var statusHandlers = require('./statusHandlers');
var responseHandlers = require('./responseHandlers');
var package = require('../package.json');

var mcstatic = function(options){
    if(!options)
        options = {};

    var self = this;
    self.addedMocks = [];
    self.options = options;
    self.options.root = path.join(path.resolve(options.root), '/');
    if(!self.options.mockPaths)
        self.options.mockPaths = {};

    process.addListener('exit',self.flush)
};

mcstatic.prototype.createServer = function(){
    this.server = http.createServer(this.listener());
    return this.server;
};

mcstatic.prototype.listener = function() {
    var self = this;
    return function(req, res, next){
        var requestPath = httpHelpers.getRequestPathFromUrl(req.url);

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
                    var filePath = createTempMockData(mockRequest[mock]);
                    var relativePath = path.relative(self.options.root,filePath);
                    self.options.mockPaths[mock] = relativePath;
                    res.end();
                }
            });
        }
    };
};

var createTempMockData = function(mockData){
    var info = temp.openSync({suffix: ".json"});
    fs.writeSync(info.fd, JSON.stringify(mockData));
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

mcstatic.prototype.whenGET = function(urlPath){
    return this.when('POST',urlPath);
};
mcstatic.prototype.whenPOST = function(urlPath){
    return this.when('POST',urlPath);
};
mcstatic.prototype.whenPUT = function(urlPath){
    return this.when('POST',urlPath);
};
mcstatic.prototype.whenDELETE = function(urlPath){
    return this.when('DELETE',urlPath);
};
mcstatic.prototype.whenHEAD = function(urlPath){
    return this.when('HEAD',urlPath);
};
mcstatic.prototype.whenPATCH = function(urlPath){
    return this.when('PATCH',urlPath);
};

mcstatic.prototype.when = function(method,urlPath){
    var self = this;
    var uri = 'http://'+self.server.address().address + self.server.address().port;
    self.addedMocks.push(urlPath);
    return {
        respond : function(responseData, onResponse){
            request.post({
                    uri: uri+'/__mcstatic__',
                    followRedirect: false,
                    json: responseData
                }, onResponse);
        }
    }
};
mcstatic.prototype.flush = function(){
    var self = this;
    if(!self.addedMocks || !self.mockPaths)
        return;

    self.addedMocks.forEach(function(element){
        if(self.mockPaths[element])
            delete self.mockPaths[element];
    })
};
module.exports = function(options){
    return new mcstatic(options);
};
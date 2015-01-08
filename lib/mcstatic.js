var http = require('http');
var path = require('path');
var request = require('request');
var staticFileHandler = require('./staticFileHandler');
var mcstaticApiHandler = require('./mcstaticApiHandler');

var mcstatic = function(options){
    if(!options)
        options = {};

    this.addedMocks = [];
    this.options = options;
    this.options.apiPath = '/__mcstatic__';
    this.options.root = path.join(path.resolve(options.root), '/');
    if(!this.options.mockPaths)
        this.options.mockPaths = {};

    process.addListener('exit',this.flush)
};

mcstatic.prototype.createServer = function(){
    this.server = http.createServer(mcstaticApiHandler(this.options,
                                    staticFileHandler(this.options)));
    return this.server;
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
    var uri = 'http://'+this.server.address().address + this.server.address().port+this.options.apiPath;
    this.addedMocks.push(urlPath);

    return {
        respond : function(responseData, onResponse){
            request.post({
                    uri: uri,
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
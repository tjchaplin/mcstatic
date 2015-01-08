var http = require('http');
var path = require('path');
var request = require('request');
var staticFileHandler = require('./staticFileHandler');
var mcstaticApiHandler = require('./mcstaticApiHandler');

module.exports = {
    _options : {
        root : './',
        port : '8080',
        mockPaths : {},
        address : 'localhost',
        apiPath : '/__mcstatic__'
    },
    _addedMocks : [],
    options : function(options){
        if(!options)
            options = {};

        for (var key in options)
            this._options[key] = options[key];

        this._options.root = path.join(path.resolve(this._options.root), '/');
        if(!this._options.mockPaths)
            this._options.mockPaths = {};
    },
    createServer : function(options){
        var self = this;
        self.options(options);
        var server = http.createServer(mcstaticApiHandler(self._options,
                                    staticFileHandler(self._options)));

        self.listen = function(port,next){
            self._options.port = port;
            return server.listen(port,next);
        };
        
        self.close = server.close;
        return self;
    },
    whenGET : function(urlPath){
        return this.when('POST',urlPath);
    },
    whenPOST : function(urlPath){
        return this.when('POST',urlPath);
    },
    whenPUT : function(urlPath){
        return this.when('POST',urlPath);
    },
    whenDELETE : function(urlPath){
        return this.when('DELETE',urlPath);
    },
    whenHEAD : function(urlPath){
        return this.when('HEAD',urlPath);
    },
    whenPATCH : function(urlPath){
        return this.when('PATCH',urlPath);
    },
    when : function(method,urlPath){
        process.addListener('exit',this.flush)

        var uri = 'http://'+this._options.address + ':' + this._options.port+this._options.apiPath;
        this._addedMocks.push(urlPath);

        return {
            respond : function(responseData, onResponse){
                var mockPath = {};
                mockPath[urlPath] = responseData;
                request.post({
                        uri: uri,
                        followRedirect: false,
                        json: mockPath
                    }, onResponse);
            }
        }
    },
    flush : function(){
        var self = this;
        if(!self._addedMocks || !self._options.mockPaths)
            return;

        self._addedMocks.forEach(function(element){
            if(self._options.mockPaths[element])
                delete self._options.mockPaths[element];
        })
    }
};
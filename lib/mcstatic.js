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

        if(!options.apiPath)
            options.apiPath = '/__mcstatic__';
        
        if(!options.root)
            options.root = './';

        this._options = options;
        this._options.root = path.join(path.resolve(options.root), '/');
        if(!this._options.mockPaths)
            this._options.mockPaths = {};
    },
    createServer : function(options){
        var self = this;
        self.options(options);
        var server = http.createServer(mcstaticApiHandler(this._options,
                                    staticFileHandler(this._options)));
        this.listen = function(port,next){
            return server.listen(port,function(){
                self._options.port = server.address().port;
                self._options.address = server.address().address;
                next();
            });
        };
        this.close = server.close;
        return this;
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

        var uri = 'http://'+this._options.address + this._options.port+this._options.apiPath;
        this._addedMocks.push(urlPath);

        return {
            respond : function(responseData, onResponse){
                request.post({
                        uri: uri,
                        followRedirect: false,
                        json: responseData
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
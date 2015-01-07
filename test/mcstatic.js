var http = require('http');
var assert = require('assert');
var request = require('./request');
var cases = require('./common-cases');
var mcstatic =  require('../index.js');

var filenames = Object.keys(cases);

describe('When using mcstatic server',function(){
    var options = {
        root : './test/public',
        port : 8080
    };
    var server ={};
    var baseUrl = 'http://localhost:' + options.port;

    beforeEach(function(done){
        server = http.createServer(mcstatic(options))
                    .listen(options.port, function () {
                        done();
                    });
    })

    afterEach(function(done){
        server.close(function(){
            done();
        })
    })

    describe('When making a GET request',function(){
        var body = null;
        var error = null;
        var response = null;
        var file = filenames[4];
        var expected = cases[file];

        beforeEach(function(done){
            var requestOptions = {
                server : server,
                uri : baseUrl + '/' +file,
                port : options.port,
                headers : cases[file].headers || {}
            };
            request.getRequest(requestOptions,function(err,res,responseBody){
                error = err;
                response = res;
                body = responseBody.replace(/\s/g,'');
                expected.body=expected.body.replace(/\s/g,'');
                done();
            })
        });

        afterEach(function(){
            body = null;
            error = null;
            response = null;
        });

        it('Should have correct status code',function(){
            assert(expected.statusCode === response.statusCode)
        });
        it('Should have the expected body',function(){
            assert(body === expected.body);
        });
        it('Should have the expected header location',function(){
            assert(expected.headers.location === response.headers.location);
        });
        it('Should have the expected content type',function(){
            assert(expected.headers['content-type'] === response.headers['content-type']);
        });
    })
});
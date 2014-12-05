var _      = require("underscore")
  , ndata  = require('../index')
  , assert = require('assert')

describe('ndata server is up and running', function(){
  describe('ndata#createServer', function(){
    it('should provide ndata.createServer', function(){
      assert(_.isFunction(ndata.createServer), true)
    });
  });

  var server = ndata.createServer({port: 9000});
  
  describe('ndata#createServer', function(){
    it('should provide server.on', function(){
      assert(_.isFunction(server.on), true)
    });
  });
})

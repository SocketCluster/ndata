var _      = require("underscore")
  , ndata  = require('../index')
  , assert = require('assert')
  , conf   = {port: 9001}
  , server;
  
/*
describe('ndata server is up and running', function () {
  
  before("run server", function (done) {
    server = ndata.createServer(conf);
    server.on("ready", function () {
      done();
    });
  });

  after("shut down server", function (done) {
    server.destroy();
    done();
  });
  
  describe('ndata#createServer', function () {
    it('should provide server.on', function (done) {
      assert(_.isFunction(server.on), true);
      done();
    });
  });

  describe('ndata#createServer', function () {
    it('should provide server.destroy', function (done) {
      assert(_.isFunction(server.destroy), true);
      done();
    });
  });
  
});
*/

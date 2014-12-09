var _      = require("underscore")
  , ndata  = require('../index')
  , assert = require('assert')
  , conf   = {port: 9003}
  , server
  , client;


describe('ndata#known to fail', function () {

  before("create server", function (done) {
    server = ndata.createServer(conf);
    server.on("ready", function(err){
      client = ndata.createClient(conf);
      done();
    });
  });

  after("shut down server", function (done) {
    server.destroy();
    done();
  });

  describe('dont crashes node if test is outside a ndata callback; ok: ', function () {
    it('should timeout', function (done) {
      setTimeout(function(){
        assert(false, true);
        done();
      }, 500)
    });

    describe('crashes node if test is inside a ndata callback; crash:', function () {
      it('should set a value', function (done) {
        client.set(["a", "b"], 1, function (err, value) {
          assert(false, true);
          done();
        });
      });
    });
  });
});

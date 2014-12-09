var _      = require("underscore")
  , ndata  = require('../index')
  , assert = require('assert')
  , conf   = {port: 9002}
  , server
  , client;

describe('ndata client, server should already run from test.server', function () {

  before("run the server before start", function (done) {
    server = ndata.createServer(conf);
    server.on("ready", function () {
      client = ndata.createClient(conf);
      done();
    });
  });

  after("shut down server afterwards", function (done) {
    server.destroy();
    done();
  });

  describe('ndata#createClient', function () {
    it('should provide ndata.createClient', function (done) {
      assert.equal(_.isFunction(ndata.createClient), true);
      done();
    });
  });

  describe('client#set', function () {
    it('should provide client.set', function (done) {
      assert.equal(_.isFunction(client.set), true);
      done();
    });
  });

  describe('client#get', function () {
    it('should provide client.get', function (done) {
      assert.equal(_.isFunction(client.get), true);
      done();
    });
  });

  var val1   = 'This is a value'
    , path1  = ['a', 'b', 'c']

  describe('client#set', function () {
    it('should set and return values', function (done) {
      client.set(path1, val1, true, function (err, value) {
        assert.equal(value , val1);
        done();
      });
    });
  });

  var path2  = ['d', 'e', 'f']

  describe('client#set', function () {
    it('should return null if no value is demanded', function (done) {
      client.set(path2, val1, function (err, value) {
        assert.equal(value , undefined);
        assert.equal(value , null); //!!
        done();
      });
    });
  });

  var val2   = 'append this'

  describe('client#add', function () {
    it('should add a value to an existing, '
      + 'existing should be kept'
      , function (done) {
          client.add(path2, val2, function (err, value) {
            client.get(path2, function (err, value) {

              assert.equal(value[0] , val1);
              assert.equal(value[1] , val2);
              done();
            });
          });
        });
  });

  var val3 = [1, 2, 3, 4]
    , path3  = ['g', 'h', 'i']

  describe('client#concat', function () {
    it('should concat string values', function (done) {
      client.set(path3, val1, function (err) {
        client.concat(path3, val2, function (err) {
          client.get(path3, function (err, value) {
            assert.equal(value[0] , val1);
            assert.equal(value[1] , val2);
            done();
          });
        });
      });
    });
  });

  var  path4  = ['j', 'k', 'l']

  describe('client#concat', function () {
    it('should concat arrays', function (done) {
      client.set(path4, val1, function (err) {
        client.concat(path4, val3, function (err) {
          client.get(path4, function (err, value) {
            assert.equal(value[0] , val1);
            assert.equal(value[1] , val3[0]);
            assert.equal(value[2] , val3[1]);
            assert.equal(value[3] , val3[2]);
            assert.equal(value[4],  val3[3]);
            done();
          });
        });
      });
    });
  });

  var val4 = {one: 1, two: 2, three: 3}
    , path5  = ['m', 'n', 'o']
  // separat tested

  describe('client#concat', function () {
    it('should concat objects', function (done) {
      client.set(path5, val1, function (err) {
        client.concat(path5, val4, function (err) {
          client.get(path5, function (err, value) {
            done();
            assert.equal(value[0] , val1);
            assert.equal(value[1].one , val4.one);
            assert.equal(value[1].two , val4.two);
            assert.equal(value[1].three , val4.three);

          });
        });
      });
    });
  });


  var val5  = {one: 1, two: 2, three: 3, four: 4, five: 5}

  describe('client#removeRange', function () {
    it('should remove object entries by range', function (done) {
      client.set(path5, val5, function (err) {
        client.removeRange(path5, 'two', {toIndex: 'three'}, function (err, value) {
          client.get(path5, function (err, value) {
            var expected = {
              one: 1,
              three: 3,
              four: 4,
              five: 5
            };
            assert(JSON.stringify(value) == JSON.stringify(expected));
            done();
          });
        });
      });
    });
  });

  var path6     = ['p', 'q']
    , val6      = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    , expected1  = [0, 1, 2,          6, 7, 8]
    , fromIndex =  3
    , toIndex   =  6

  describe('client#removeRange', function () {
    it('should remove array entries by range', function (done) {
      client.set(path6, val6, function (err) {
        client.removeRange(path6, fromIndex, toIndex, function (err, value) {
          client.get(path6, function (err, value) {
            assert(JSON.stringify(value) == JSON.stringify(expected1));
            done();
          });
        });
      });
    });
  });

  describe('client#run', function () {
    it('should execute query functions', function (done) {
      client.set(['one', 'two', 'three', 'four'], val1, function (err) {

        var query = function (DataMap) {return DataMap.get(['one', 'two', 'three']);};

        client.run(query, function (err, value) {
          var expected = {
            four: val1
          };
          assert(JSON.stringify(value) == JSON.stringify(expected));
          done();
        });
      });
    });
  });

  describe('client#run', function () {
    it('should set values over query.data', function (done) {
      var obj = {
        x: 1,
        y: 2
      };
      var query = function (DataMap) {
        DataMap.set('point', point);
        return DataMap.get(['point']);
      };
      query.data = {
        point: obj
      };
      client.run(query, function (err, value) {
        var expected = {
          x: 1,
          y: 2
        };
        assert(JSON.stringify(value) == JSON.stringify(expected));
        done();
      });
    });
  });

  var arr = [0, 1, 2, 3, 4, 5, 6, 7]
    , obj = {red: 1, green: 2, blue: 3, yellow: 4, orange: 5}
    , path7 = ['this', 'is', 'an', 'array']

  describe('client#getRange', function () {
    it('should get range test1', function (done) {
      client.set(path7, arr, function (err) {
        client.getRange(path7, 2, 5, function (err, value) {
          var expected = [2, 3, 4];
          assert(JSON.stringify(value) == JSON.stringify(expected));
          done();
        });
      });
    });
  });

  describe('client#getRange', function () {
    it('should get range test2', function (done) {
      client.set(path7, arr, function (err) {

        client.getRange(path7, 4, function (err, value) {
          var expected = [4, 5, 6, 7];
          assert(JSON.stringify(value) == JSON.stringify(expected));
          done();
        });
      });
    });
  });

  describe('client#getRange', function () {
    it('should get range test3', function (done) {
      client.set(path7, arr, function (err) {

        client.getRange(path7, 0, 5, function (err, value) {
          var expected = [0, 1, 2, 3, 4];
          assert(JSON.stringify(value) == JSON.stringify(expected));
          done();
        });
      });
    });
  });

  describe('client#getRange', function () {
    it('should get range test4', function (done) {
      client.set(path7, arr, function (err) {
        client.getRange(path7, 4, 15, function (err, value) {
          var expected = [4, 5, 6, 7];
          assert(JSON.stringify(value) == JSON.stringify(expected));
          done();
        });
      });
    });
  });

  var path8 = ['this', 'is', 'an', 'object']

  describe('client#getRange', function () {
    it('should get range test5', function (done) {
      client.set(path8, obj, function (err) {
        client.getRange(path8, 'green', 'blue', function (err, value) {
          var expected = {
            green: 2
          };
          assert(JSON.stringify(value) == JSON.stringify(expected));
          done();
        });
      });
    });
  });

  describe('client#getRange', function () {
    it('should get range test6', function (done) {
      client.getRange(path8, 'blue', function (err, value) {
        var expected = {
          blue: 3,
          yellow: 4,
          orange: 5
        };
        assert(JSON.stringify(value) == JSON.stringify(expected));
        done();
      });
    });
  });

  describe('client#getRange', function () {
    it('should get range test7', function (done) {
      client.getRange(path8, 'blue', function (err, value) {
        client.getRange(path8, 'green', 'yellow', function (err, value) {
          var expected = {
            green: 2,
            blue: 3
          };
          assert(JSON.stringify(value) == JSON.stringify(expected));
          done();
        });
      });
    });
  });

  var path9 = ['that', '8a788b9c-c50e-0b3f-bd47-ec0c63327bf1']

  describe('client#set', function () {
    it('should set properly in callbacks (double set to the same path)', function (done) {
      client.set(path9, [1, 2, 3, 4, 5], function (err) {
        client.set(path9, [6, 7, 8], function (err) {
          client.get('that', function (err, value) {
            var expected = {
              '8a788b9c-c50e-0b3f-bd47-ec0c63327bf1': [6, 7, 8]
            };
            assert(JSON.stringify(value) == JSON.stringify(expected));
            done();
          });
        });
      });
    });
  });

  describe('client#splice', function () {
    it('should splice values test1', function (done) {
      var itemsA = ['a', 'b', 'c', 'd', 'e'];
      client.set(['levelA1', 'levelA2'], itemsA, function (err) {
        var spliceOptions = {
          index: 2,
          count: 2,
          items: ['c2', 'd2']
        };
        client.splice(['levelA1', 'levelA2'], spliceOptions, function (err) {
          client.get(['levelA1', 'levelA2'], function (err, value) {
            var expected = ['a', 'b', 'c2', 'd2', 'e'];
            assert(JSON.stringify(value) == JSON.stringify(expected));
            done();
          });
        });
      });
    });
  });

  var itemsB = ['a', 'b', 'c', 'd', 'e'];
  describe('client#splice', function () {
    it('should splice values test2', function (done) {
      client.set(['levelB1', 'levelB2'], itemsB, function (err) {
        var spliceOptions = {
          index: 2
        };
        client.splice(['levelB1', 'levelB2'], spliceOptions, function (err) {
          client.get(['levelB1', 'levelB2'], function (err, value) {
            var expected = ['a', 'b'];
            assert(JSON.stringify(value) == JSON.stringify(expected));
            done();
          });
        });
      });
    });
  });

  var itemsC = ['a', 'b', 'c', 'd', 'e'];
  describe('client#splice', function () {
    it('should splice values test3', function (done) {

      client.set(['levelC1', 'levelC2'], itemsC, function (err) {
        var spliceOptions = {
          count: 3
        };
        client.splice(['levelC1', 'levelC2'], spliceOptions, function (err) {
          client.get(['levelC1', 'levelC2'], function (err, value) {
            var expected = ['d', 'e'];
            assert(JSON.stringify(value) == JSON.stringify(expected));
            done();
          });
        });
      });
    });
  });


  var itemsD = ['c', 'd', 'e'];
  describe('client#splice', function () {
    it('should splice values test4', function (done) {

      client.set(['levelD1', 'levelD2'], itemsD, function (err) {
        var spliceOptions = {
          items: ['a', 'b']
        };
        client.splice(['levelD1', 'levelD2'], spliceOptions, function (err) {
          client.get(['levelD1', 'levelD2'], function (err, value) {
            var expected = ['a', 'b', 'c', 'd', 'e'];
            assert(JSON.stringify(value) == JSON.stringify(expected));
            done();
          });
        });
      });
    });
  });

  var itemsE = ['a', 'b'];
  describe('client#splice', function () {
    it('should splice values test5', function (done) {

      client.set(['levelE1', 'levelE2'], itemsE, function (err) {
        var spliceOptions = {
          index: 2,
          count: 0,
          items: [{key1: 1, key2: {nestedKey1: 'hi'}}, 'c']
        };
        client.splice(['levelE1', 'levelE2'], spliceOptions, function (err) {
          client.get(['levelE1', 'levelE2'], function (err, value) {
            var expected = ['a', 'b', {key1: 1, key2: {nestedKey1: 'hi'}}, 'c'];
            assert(JSON.stringify(value) == JSON.stringify(expected));
          });
          client.get(['levelE1', 'levelE2', 2, 'key2'], function (err, value) {
            var expected = {nestedKey1: 'hi'};
            assert(JSON.stringify(value) == JSON.stringify(expected));
            done();
          });
        });
      });
    });
  });
  //
  describe('client#subscriptions', function () {
    it('should have no subsscriptions (empty array)', function (done) {
      assert(JSON.stringify(client.subscriptions()) == JSON.stringify([]));
      done();
    });
  });

  describe('client#subscriptions', function () {
    it('should subscribe channel foo', function (done) {

      client.subscribe('foo', function (err) {
        assert(client.isSubscribed('foo') == true);
        assert(JSON.stringify(client.subscriptions()) == JSON.stringify(['foo']));
        done();
      });
    });
  });
  
  describe('client#expire', function () {
  
    // Note that for efficiency reasons, the expiry accuracy is 1000 milliseconds -
    // Also the provided expiry should be an integer (in seconds).
    
    it('value should expire after certain time', function (done) {
      client.set(['check', 'expire', 'key'], 'some data', function (err) {
        client.expire([['check', 'expire', 'key']], 1);
        setTimeout(function () {
          client.get(['check'], function (err, value) {
            var expected = {
              expire: {}
            };
            assert(JSON.stringify(value) == JSON.stringify(expected));
            done();
          });
        }, 1500);
      });
    });
  });
  
});

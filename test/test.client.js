var _      = require("underscore")
  , ndata  = require('../index')
  , assert = require('assert')
  , val1   = 'This is a value'
  , val2   = 'append this'
  , val3 = [1, 2, 3, 4]
  , val4 = {one: 1, two: 2, three: 3}
  , path1  = ['a', 'b', 'c']
  , path2  = ['d', 'e', 'f']
  , path3  = ['g', 'h', 'i']
  , path4  = ['j', 'k', 'l']
  , path5  = ['m', 'n', 'o']
// separat tested



describe('ndata client', function(){
  describe('ndata#createClient', function(){
    it('should provide ndata.createClient', function(done){
      assert.equal(_.isFunction(ndata.createClient), true);
      done();
    });
  });

  var clientA = ndata.createClient({port: 9000});

  describe('client#set', function(){
    it('should provide client.set', function(done){
      assert.equal(_.isFunction(clientA.set), true);
      done();
    });
  });

  describe('client#get', function(){
    it('should provide client.get', function(done){
      assert.equal(_.isFunction(clientA.get), true);
      done();
    });
  });
  describe('client#set', function(){
    it('should set and return values', function(done){
      clientA.set(path1, val1, true, function(err, value) {
        assert.equal(value , val1);
        done();
      });
    });
  });

  describe('client#set', function(){
    it('should return null if no value is demanded', function(done){
      clientA.set(path2, val1, function(err, value) {
        assert.equal(value , 1);
        done();
      });
    });
  });

  describe('client#add', function(){
    it('should add a value to an existing, existing should be kept', function(done){

      clientA.add(path2, val2, function(err, value) {
        clientA.get(path2, function(err, value) {

          assert.equal(value[0] , val1);
          assert.equal(value[1] , val2);
          done();
        });
      });
    });
  });

  describe('client#concat', function(){
    it('should concat string values', function(done){
      clientA.set(path3, val1, function(err) {
        clientA.concat(path3, val2, function(err) {
          clientA.get(path3, function(err, value) {
            assert.equal(value[0] , val1);
            assert.equal(value[1] , val2);
            done()
          });
        });
      });
    });
  });

  describe('client#concat', function(){
    it('should concat arrays', function(done){
      clientA.set(path4, val1, function(err) {
        clientA.concat(path4, val3, function(err) {
          clientA.get(path4, function(err, value) {
            assert.equal(value[0] , val1);
            assert.equal(value[1] , val3[0]);
            assert.equal(value[2] , val3[1]);
            assert.equal(value[3] , val3[2]);
            assert.equal(value[4],  val3[3]);
            done()
          });
        });
      });
    });
  });

  describe('client#concat', function(){
    it('should concat objects', function(done){
      clientA.set(path5, val1, function(err) {
        clientA.concat(path5, val4, function(err) {
          clientA.get(path5, function(err, value) {
            done()
            assert.equal(value[0] , val1);
            assert.equal(value[1].one , val4.one);
            assert.equal(value[1].two , val4.two);
            assert.equal(value[1].three , val4.three);

          });
        });
      });
    });
  });

});

//  clientA.set(['m', 'n', 'o'], {one: 1, two: 2, three: 3, four: 4, five: 5}, function(err) {
//    clientA.removeRange(['m', 'n', 'o'], 'two', {toIndex: 'three'}, function(err, value) {
//      clientA.get(['m', 'n', 'o'], function(err, value) {
//        var expected = {
//          one: 1,
//          three: 3,
//          four: 4,
//          five: 5
//        };
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//      });
//    });
//  });
//
//  clientA.set(['p', 'q'], [0, 1, 2, 3, 4, 5, 6, 7, 8], function(err) {
//    clientA.removeRange(['p', 'q'], 3, 6, function(err, value) {
//      clientA.get(['p', 'q'], function(err, value) {
//        var expected = [0, 1, 2, 6, 7, 8];
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//      });
//    });
//  });
//
//  clientA.set(['one', 'two', 'three', 'four'], val, function(err) {
//    var query = function(DataMap) {return DataMap.get(['one', 'two', 'three']);};
//
//    clientA.run(query, function(err, value) {
//      var expected = {
//        four: val
//      };
//      assert(JSON.stringify(value) == JSON.stringify(expected));
//    });
//  });
//
//  var obj = {
//    x: 1,
//    y: 2
//  };
//  var query = function(DataMap) {
//    DataMap.set('point', point);
//    return DataMap.get(['point']);
//  };
//  query.data = {
//    point: obj
//  };
//
//  clientA.run(query, function(err, value) {
//    var expected = {
//      x: 1,
//      y: 2
//    };
//    assert(JSON.stringify(value) == JSON.stringify(expected));
//  });
//
//  var arr = [0, 1, 2, 3, 4, 5, 6, 7];
//  var obj = {red: 1, green: 2, blue: 3, yellow: 4, orange: 5};
//
//  clientA.set(['this', 'is', 'an', 'array'], arr, function(err) {
//    clientA.getRange(['this', 'is', 'an', 'array'], 2, 5, function(err, value) {
//      var expected = [2, 3, 4];
//      assert(JSON.stringify(value) == JSON.stringify(expected));
//    });
//
//    clientA.getRange(['this', 'is', 'an', 'array'], 4, function(err, value) {
//      var expected = [4, 5, 6, 7];
//      assert(JSON.stringify(value) == JSON.stringify(expected));
//    });
//
//    clientA.getRange(['this', 'is', 'an', 'array'], 0, 5, function(err, value) {
//      var expected = [0, 1, 2, 3, 4];
//      assert(JSON.stringify(value) == JSON.stringify(expected));
//    });
//
//    clientA.getRange(['this', 'is', 'an', 'array'], 4, 15, function(err, value) {
//      var expected = [4, 5, 6, 7];
//      assert(JSON.stringify(value) == JSON.stringify(expected));
//    });
//  });
//
//  clientA.set(['this', 'is', 'an', 'object'], obj, function(err) {
//    clientA.getRange(['this', 'is', 'an', 'object'], 'green', 'blue', function(err, value) {
//      var expected = {
//        green: 2
//      };
//      assert(JSON.stringify(value) == JSON.stringify(expected));
//    });
//
//    clientA.getRange(['this', 'is', 'an', 'object'], 'blue', function(err, value) {
//      var expected = {
//        blue: 3,
//        yellow: 4,
//        orange: 5
//      };
//      assert(JSON.stringify(value) == JSON.stringify(expected));
//    });
//
//    clientA.getRange(['this', 'is', 'an', 'object'], 'green', 'yellow', function(err, value) {
//      var expected = {
//        green: 2,
//        blue: 3
//      };
//      assert(JSON.stringify(value) == JSON.stringify(expected));
//    });
//  });
//
//  clientA.set(['that', '8a788b9c-c50e-0b3f-bd47-ec0c63327bf1'], [1, 2, 3, 4, 5], function(err) {
//    clientA.set(['that', '8a788b9c-c50e-0b3f-bd47-ec0c63327bf1'], [6, 7, 8], function(err) {
//      clientA.get('that', function(err, value) {
//        var expected = {
//          '8a788b9c-c50e-0b3f-bd47-ec0c63327bf1': [6, 7, 8]
//        };
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//      });
//    });
//  });
//
//  var itemsA = ['a', 'b', 'c', 'd', 'e'];
//
//  clientA.set(['levelA1', 'levelA2'], itemsA, function(err) {
//    var spliceOptions = {
//      index: 2,
//      count: 2,
//      items: ['c2', 'd2']
//    };
//    clientA.splice(['levelA1', 'levelA2'], spliceOptions, function(err) {
//      clientA.get(['levelA1', 'levelA2'], function(err, value) {
//        var expected = ['a', 'b', 'c2', 'd2', 'e'];
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//      });
//    });
//  });
//
//  var itemsB = ['a', 'b', 'c', 'd', 'e'];
//
//  clientA.set(['levelB1', 'levelB2'], itemsB, function(err) {
//    var spliceOptions = {
//      index: 2
//    };
//    clientA.splice(['levelB1', 'levelB2'], spliceOptions, function(err) {
//      clientA.get(['levelB1', 'levelB2'], function(err, value) {
//        var expected = ['a', 'b'];
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//      });
//    });
//  });
//
//  var itemsC = ['a', 'b', 'c', 'd', 'e'];
//
//  clientA.set(['levelC1', 'levelC2'], itemsC, function(err) {
//    var spliceOptions = {
//      count: 3
//    };
//    clientA.splice(['levelC1', 'levelC2'], spliceOptions, function(err) {
//      clientA.get(['levelC1', 'levelC2'], function(err, value) {
//        var expected = ['d', 'e'];
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//      });
//    });
//  });
//
//  var itemsD = ['c', 'd', 'e'];
//
//  clientA.set(['levelD1', 'levelD2'], itemsD, function(err) {
//    var spliceOptions = {
//      items: ['a', 'b']
//    };
//    clientA.splice(['levelD1', 'levelD2'], spliceOptions, function(err) {
//      clientA.get(['levelD1', 'levelD2'], function(err, value) {
//        var expected = ['a', 'b', 'c', 'd', 'e'];
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//      });
//    });
//  });
//
//  var itemsE = ['a', 'b'];
//
//  clientA.set(['levelE1', 'levelE2'], itemsE, function(err) {
//    var spliceOptions = {
//      index: 2,
//      count: 0,
//      items: [{key1: 1, key2: {nestedKey1: 'hi'}}, 'c']
//    };
//    clientA.splice(['levelE1', 'levelE2'], spliceOptions, function(err) {
//      clientA.get(['levelE1', 'levelE2'], function(err, value) {
//        var expected = ['a', 'b', {key1: 1, key2: {nestedKey1: 'hi'}}, 'c'];
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//      });
//      clientA.get(['levelE1', 'levelE2', 2, 'key2'], function(err, value) {
//        var expected = {nestedKey1: 'hi'};
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//      });
//    });
//  });
//
//  assert(JSON.stringify(clientA.subscriptions()) == JSON.stringify([]));
//
//  clientA.subscribe('foo', function (err) {
//    assert(clientA.isSubscribed('foo') == true);
//    assert(JSON.stringify(clientA.subscriptions()) == JSON.stringify(['foo']));
//  });
//
//  clientA.set(['check', 'expire', 'key'], 'some data', function(err) {
//    clientA.expire([['check', 'expire', 'key']], 5);
//    setTimeout(function () {
//      clientA.get(['check'], function(err, value) {
//        var expected = {
//          expire: {}
//        };
//        assert(JSON.stringify(value) == JSON.stringify(expected));
//
//        console.log('All tests passed!');
//        // server.destroy()
//        process.exit();
//      });
//    }, 11000);
//  });
//}); // server ready

var ndata = require('../index');
var assert = require('assert');

var server = ndata.createServer({port: 9000});
var clientA = ndata.createClient({port: 9000});

console.log('Running tests...');

var val = 'This is a value';

clientA.set(['a', 'b', 'c'], val, true, function(err, value) {
  assert(value == val);
});

clientA.set(['d', 'e', 'f'], val, function(err, value) {
  assert(value == null);
});

clientA.add(['g', 'h', 'i'], 'append this', function(err, value) {
  clientA.get(['g', 'h', 'i', 0], function(err, value) {
    assert(value == 'append this');

    clientA.concat(['g', 'h', 'i'], [1, 2, 3, 4], function(err, value) {
      clientA.get(['g', 'h', 'i'], function(err, value) {
        assert(JSON.stringify(value) == JSON.stringify(['append this', 1, 2, 3, 4]));

        clientA.concat(['g', 'h', 'i'], {one: 1, two: 2, three: 3}, function(err, value) {
          clientA.get(['g', 'h', 'i'], function(err, value) {
            var expected = {
              0: 'append this',
              1: 1,
              2: 2,
              3: 3,
              4: 4,
              one: 1,
              two: 2,
              three: 3
            };
            assert(JSON.stringify(value) == JSON.stringify(expected));
          });
        });
      });
    });
  });
});

clientA.set(['m', 'n', 'o'], {one: 1, two: 2, three: 3, four: 4, five: 5}, function(err) {
  clientA.removeRange(['m', 'n', 'o'], 'two', {toIndex: 'three'}, function(err, value) {
    clientA.get(['m', 'n', 'o'], function(err, value) {
      var expected = {
        one: 1,
        three: 3,
        four: 4,
        five: 5
      };
      assert(JSON.stringify(value) == JSON.stringify(expected));
    });
  });
});

clientA.set(['p', 'q'], [0, 1, 2, 3, 4, 5, 6, 7, 8], function(err) {
  clientA.removeRange(['p', 'q'], 3, 6, function(err, value) {
    clientA.get(['p', 'q'], function(err, value) {
      var expected = [0, 1, 2, 6, 7, 8];
      assert(JSON.stringify(value) == JSON.stringify(expected));
    });
  });
});

clientA.set(['one', 'two', 'three', 'four'], val, function(err) {
  var query = function(DataMap) {return DataMap.get(['one', 'two', 'three']);};

  clientA.run(query, function(err, value) {
    var expected = {
      four: val
    };
    assert(JSON.stringify(value) == JSON.stringify(expected));
  });
});

var obj = {
  x: 1,
  y: 2
};
var query = function(DataMap) {
  DataMap.set('point', point);
  return DataMap.get(['point']);
};
query.data = {
  point: obj
};

clientA.run(query, function(err, value) {
  var expected = {
    x: 1,
    y: 2
  };
  assert(JSON.stringify(value) == JSON.stringify(expected));
});

var arr = [0, 1, 2, 3, 4, 5, 6, 7];
var obj = {red: 1, green: 2, blue: 3, yellow: 4, orange: 5};

clientA.set(['this', 'is', 'an', 'array'], arr, function(err) {
  clientA.getRange(['this', 'is', 'an', 'array'], 2, 5, function(err, value) {
    var expected = [2, 3, 4];
    assert(JSON.stringify(value) == JSON.stringify(expected));
  });

  clientA.getRange(['this', 'is', 'an', 'array'], 4, function(err, value) {
    var expected = [4, 5, 6, 7];
    assert(JSON.stringify(value) == JSON.stringify(expected));
  });

  clientA.getRange(['this', 'is', 'an', 'array'], 0, 5, function(err, value) {
    var expected = [0, 1, 2, 3, 4];
    assert(JSON.stringify(value) == JSON.stringify(expected));
  });

  clientA.getRange(['this', 'is', 'an', 'array'], 4, 15, function(err, value) {
    var expected = [4, 5, 6, 7];
    assert(JSON.stringify(value) == JSON.stringify(expected));
  });
});

clientA.set(['this', 'is', 'an', 'object'], obj, function(err) {
  clientA.getRange(['this', 'is', 'an', 'object'], 'green', 'blue', function(err, value) {
    var expected = {
      green: 2
    };
    assert(JSON.stringify(value) == JSON.stringify(expected));
  });

  clientA.getRange(['this', 'is', 'an', 'object'], 'blue', function(err, value) {
    var expected = {
      blue: 3,
      yellow: 4,
      orange: 5
    };
    assert(JSON.stringify(value) == JSON.stringify(expected));
  });

  clientA.getRange(['this', 'is', 'an', 'object'], 'green', 'yellow', function(err, value) {
    var expected = {
      green: 2,
      blue: 3
    };
    assert(JSON.stringify(value) == JSON.stringify(expected));
  });
});

clientA.set(['that', '8a788b9c-c50e-0b3f-bd47-ec0c63327bf1'], [1, 2, 3, 4, 5], function(err) {
  clientA.set(['that', '8a788b9c-c50e-0b3f-bd47-ec0c63327bf1'], [6, 7, 8], function(err) {
    clientA.get('that', function(err, value) {
      var expected = {
        '8a788b9c-c50e-0b3f-bd47-ec0c63327bf1': [6, 7, 8]
      };
      assert(JSON.stringify(value) == JSON.stringify(expected));
    });
  });
});

clientA.set(['check', 'expire', 'key'], 'some data', function(err) {
  clientA.expire([['check', 'expire', 'key']], 5);
  setTimeout(function () {
    clientA.get(['check'], function(err, value) {
      var expected = {
        expire: {}
      };
      assert(JSON.stringify(value) == JSON.stringify(expected));

      console.log('All tests passed!');
      process.exit();
    });
  }, 11000);
});

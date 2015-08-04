var args = JSON.parse(process.argv[2]);

var PORT;
if (args.port) {
  PORT = parseInt(args.port);
}
var ID = args.id;
var INSTANCE_ID = args.instanceId;
var SOCKET_PATH = args.socketPath;
var SECRET_KEY = args.secretKey;
var EXPIRY_ACCURACY = args.expiryAccuracy || 1000;
var BROKER_CONTROLLER_PATH = args.brokerControllerPath;
var DOWNGRADE_TO_USER = args.downgradeToUser;
var PROCESS_TERM_TIMEOUT = args.processTermTimeout || 10000;
var BROKER_OPTIONS = args.brokerOptions;

var BROKER_CONTROLLER;
if (BROKER_CONTROLLER_PATH) {
  BROKER_CONTROLLER = require(BROKER_CONTROLLER_PATH);
}

var EventEmitter = require('events').EventEmitter;

var fs = require('fs');
var domain = require('domain');
var com = require('ncom');
var ExpiryManager = require('expirymanager').ExpiryManager;
var FlexiMap = require('fleximap').FlexiMap;

var initialized = {};

var errorHandler = function (err) {
  var error;

  if (err.stack) {
    error = {
      message: err.message,
      stack: err.stack
    };
  } else {
    error = err;
  }

  process.send({event: 'error', data: error});
};

var errorDomain = domain.create();
errorDomain.on('error', errorHandler);

if (DOWNGRADE_TO_USER && process.setuid) {
  try {
    process.setuid(DOWNGRADE_TO_USER);
  } catch (err) {
    errorDomain.emit('error', new Error('Could not downgrade to user "' + DOWNGRADE_TO_USER +
      '" - Either this user does not exist or the current process does not have the permission' +
      ' to switch to it.'));
  }
}

var escapeStr = '\\u001b';
var escapeArr = escapeStr.split('');

var send = function (socket, object) {
  socket.write(object);
};

var dataMap = new FlexiMap();
var channelMap = new FlexiMap();

var dataExpirer = new ExpiryManager();

var addListener = function (socket, channel) {
  channelMap.set(['sockets', socket.id].concat(channel), socket);
};

var hasListener = function (socket, channel) {
  return channelMap.hasKey(['sockets', socket.id].concat(channel));
};

var anyHasListener = function (channel) {
  var sockets = channelMap.get('sockets');
  for (var i in sockets) {
    if (sockets.hasOwnProperty(i)) {
      if (channelMap.hasKey(['sockets', i].concat(channel))) {
        return true;
      }
    }
  }
  return false;
};

var removeListener = function (socket, channel) {
  channelMap.remove(['sockets', socket.id].concat(channel));
};

var removeAllListeners = function (socket) {
  var subMap = channelMap.remove(['sockets', socket.id]);
  var channels = [];
  for (var i in subMap) {
    if (subMap.hasOwnProperty(i)) {
      channels.push(i);
    }
  }
  return channels;
};

var getListeners = function (socket) {
  return channelMap.get(['sockets', socket.id]);
};

var run = function (query, baseKey) {
  var rebasedDataMap;
  if (baseKey) {
    rebasedDataMap = dataMap.getRaw(baseKey);
  } else {
    rebasedDataMap = dataMap;
  }

  return Function('"use strict"; return (' + query + ')(arguments[0], arguments[1], arguments[2]);')(rebasedDataMap, dataExpirer, channelMap);
};

var Broker = function () {
  EventEmitter.call(this);
  
  this.id = ID;
  this.instanceId = INSTANCE_ID;
  this.secretKey = SECRET_KEY;
  this.options = BROKER_OPTIONS;
  
  this.dataMap = dataMap;
  this.dataExpirer = dataExpirer;
  this.channelMap = channelMap;
};

Broker.prototype = Object.create(EventEmitter.prototype);

Broker.prototype.sendToMaster = function (data) {
  process.send({
    event: 'brokerMessage',
    brokerId: this.id,
    data: data
  });
};

Broker.prototype.run = function (query, baseKey) {
  return run(query, baseKey);
};

Broker.prototype.publish = function (channel, message) {
  var sockets = channelMap.get('sockets');
  var sock, channelKey;
  for (var i in sockets) {
    if (sockets.hasOwnProperty(i)) {
      channelKey = ['sockets', i].concat(channel);
      if (channelMap.hasKey(channelKey)) {
        sock = channelMap.get(channelKey);
        if (sock instanceof com.ComSocket) {
          send(sock, {type: 'message', channel: channel, value: message});
        }
      }
    }
  }
};

var nDataBroker = new Broker();
errorDomain.add(nDataBroker);
global.broker = nDataBroker;

if (BROKER_CONTROLLER) {
  errorDomain.run(function () {
    BROKER_CONTROLLER.run(nDataBroker);
  });
}

var actions = {
  init: function (command, socket) {
    var result = {id: command.id, type: 'response', action: 'init'};
    if (command.secretKey == SECRET_KEY || !SECRET_KEY) {
      initialized[socket.id] = {};
    } else {
      result.error = 'nData Error - Invalid password was supplied to nData';
    }
    send(socket, result);
  },

  set: function (command, socket) {
    var result = nDataBroker.dataMap.set(command.key, command.value);
    var response = {id: command.id, type: 'response', action: 'set'};
    if (command.getValue) {
      response.value = result;
    }
    send(socket, response);
  },

  expire: function (command, socket) {
    nDataBroker.dataExpirer.expire(command.keys, command.value);
    var response = {id: command.id, type: 'response', action: 'expire'};
    send(socket, response);
  },

  unexpire: function (command, socket) {
    nDataBroker.dataExpirer.unexpire(command.keys);
    var response = {id: command.id, type: 'response', action: 'unexpire'};
    send(socket, response);
  },

  getExpiry: function (command, socket) {
    var response = {id: command.id, type: 'response', action: 'getExpiry', value: nDataBroker.dataExpirer.getExpiry(command.key)};
    send(socket, response);
  },

  get: function (command, socket) {
    var result = nDataBroker.dataMap.get(command.key);
    send(socket, {id: command.id, type: 'response', action: 'get', value: result});
  },

  getRange: function (command, socket) {
    var result = nDataBroker.dataMap.getRange(command.key, command.fromIndex, command.toIndex);
    send(socket, {id: command.id, type: 'response', action: 'getRange', value: result});
  },

  getAll: function (command, socket) {
    send(socket, {id: command.id, type: 'response', action: 'getAll', value: nDataBroker.dataMap.getAll()});
  },

  count: function (command, socket) {
    var result = nDataBroker.dataMap.count(command.key);
    send(socket, {id: command.id, type: 'response', action: 'count', value: result});
  },

  add: function (command, socket) {
    var result = nDataBroker.dataMap.add(command.key, command.value);
    var response = {id: command.id, type: 'response', action: 'add', value: result};
    send(socket, response);
  },

  concat: function (command, socket) {
    var result = nDataBroker.dataMap.concat(command.key, command.value);
    var response = {id: command.id, type: 'response', action: 'concat'};
    if (command.getValue) {
      response.value = result;
    }
    send(socket, response);
  },

  registerDeathQuery: function (command, socket) {
    var response = {id: command.id, type: 'response', action: 'registerDeathQuery'};

    if (initialized[socket.id]) {
      initialized[socket.id].deathQuery = command.value;
    }
    send(socket, response);
  },

  run: function (command, socket) {
    var ret = {id: command.id, type: 'response', action: 'run'};
    try {
      var result = nDataBroker.run(command.value, command.baseKey);
      if (result !== undefined) {
        ret.value = result;
      }
    } catch(e) {
      if (e.stack) {
        e = e.stack;
      }
      ret.error = 'nData Error - Exception at run(): ' + e;
    }
    if (!command.noAck) {
      send(socket, ret);
    }
  },

  remove: function (command, socket) {
    var result = nDataBroker.dataMap.remove(command.key);
    if (!command.noAck) {
      var response = {id: command.id, type: 'response', action: 'remove'};
      if (command.getValue) {
        response.value = result;
      }
      send(socket, response);
    }
  },

  removeRange: function (command, socket) {
    var result = nDataBroker.dataMap.removeRange(command.key, command.fromIndex, command.toIndex);
    if (!command.noAck) {
      var response = {id: command.id, type: 'response', action: 'removeRange'};
      if (command.getValue) {
        response.value = result;
      }
      send(socket, response);
    }
  },

  removeAll: function (command, socket) {
    nDataBroker.dataMap.removeAll();
    if (!command.noAck) {
      send(socket, {id: command.id, type: 'response', action: 'removeAll'});
    }
  },
  
  splice: function (command, socket) {
    var args = [command.key, command.index, command.count];
    if (command.items) {
      args = args.concat(command.items);
    }
    // Remove any consecutive undefined references from end of array
    for (var i = args.length - 1; i >= 0; i--) {
      if (args[i] !== undefined) {
        break;
      }
      args.pop();
    }
    var result = nDataBroker.dataMap.splice.apply(nDataBroker.dataMap, args);
    if (!command.noAck) {
      var response = {id: command.id, type: 'response', action: 'splice'};
      if (command.getValue) {
        response.value = result;
      }
      send(socket, response);
    }
  },

  pop: function (command, socket) {
    var result = nDataBroker.dataMap.pop(command.key);
    if (!command.noAck) {
      var response = {id: command.id, type: 'response', action: 'pop'};
      if (command.getValue) {
        response.value = result;
      }
      send(socket, response);
    }
  },

  hasKey: function (command, socket) {
    send(socket, {id: command.id, type: 'response', action: 'hasKey', value: nDataBroker.dataMap.hasKey(command.key)});
  },
  
  subscribe: function (command, socket) {
    var hasListener = anyHasListener(command.channel);
    addListener(socket, command.channel);
    if (!hasListener) {
      nDataBroker.emit('subscribe', command.channel);
    }
    send(socket, {id: command.id, type: 'response', action: 'subscribe', channel: command.channel});
  },

  unsubscribe: function (command, socket) {
    if (command.channel) {
      removeListener(socket, command.channel);
      var hasListener = anyHasListener(command.channel);
      if (!hasListener) {
        nDataBroker.emit('unsubscribe', command.channel);
      }
    } else {
      var channels = removeAllListeners(socket);
      for (var i in channels) {
        if (channels.hasOwnProperty(i)) {
          if (!anyHasListener(channels[i])) {
            nDataBroker.emit('unsubscribe', channels[i]);
          }
        }
      }
    }
    send(socket, {id: command.id, type: 'response', action: 'unsubscribe', channel: command.channel});
  },

  isSubscribed: function (command, socket) {
    var result = channelMap.hasKey(['sockets', socket.id, command.channel]);
    send(socket, {id: command.id, type: 'response', action: 'isSubscribed', channel: command.channel, value: result});
  },

  publish: function (command, socket) {
    nDataBroker.publish(command.channel, command.value);
    var response = {id: command.id, type: 'response', action: 'publish', channel: command.channel};
    if (command.getValue) {
      response.value = command.value;
    }
    nDataBroker.emit('publish', command.channel, command.value);
    send(socket, response);
  }
};

var MAX_ID = Math.pow(2, 53) - 2;
var curID = 1;

var genID = function () {
  curID++;
  curID = curID % MAX_ID;
  return curID;
};

var server = com.createServer();
var connections = {};

var handleConnection = errorDomain.bind(function (sock) {
  errorDomain.add(sock);
  sock.id = genID();
  
  connections[sock.id] = sock;
  
  sock.on('message', function (command) {
    if (!SECRET_KEY || initialized.hasOwnProperty(sock.id) || command.action == 'init') {
      try {
        if (actions[command.action]) {
          actions[command.action](command, sock);
        }
      } catch(e) {
        if (e.stack) {
          console.log(e.stack);
        } else {
          console.log(e);
        }
        if (e instanceof Error) {
          e = e.toString();
        }
        send(sock, {id: command.id, type: 'response', action:  command.action, error: 'nData Error - Failed to process command due to the following error: ' + e});
      }
    } else {
      var e = 'nData Error - Cannot process command before init handshake';
      console.log(e);
      send(sock, {id: command.id, type: 'response', action: command.action, error: e});
    }
  });

  sock.on('close', function () {
    delete connections[sock.id];
    
    if (initialized[sock.id]) {
      if (initialized[sock.id].deathQuery) {
        run(initialized[sock.id].deathQuery);
      }
      delete initialized[sock.id];
    }
    var channels = removeAllListeners(sock);
    for (var i in channels) {
      if (channels.hasOwnProperty(i)) {
        if (!anyHasListener(channels[i])) {
          nDataBroker.emit('unsubscribe', channels[i]);
        }
      }
    }
    errorDomain.remove(sock);
  });
});

errorDomain.add(server);
server.on('connection', handleConnection);

server.on('listening', function () {
  process.send({event: 'listening'});
});

process.on('message', function (m) {
  if (m && m.type == 'masterMessage') {
    nDataBroker.emit('masterMessage', m.data);
  }
});

process.on('SIGTERM', function () {
  server.close(function () {
    process.exit();
  });
  
  for (var i in connections) {
    if (connections.hasOwnProperty(i)) {
      connections[i].destroy();
    }
  }
  
  setTimeout(function () {
    process.exit();
  }, PROCESS_TERM_TIMEOUT);
});

if (SOCKET_PATH) {
  if (process.platform != 'win32' && fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH)
  }
  server.listen(SOCKET_PATH);
} else {
  server.listen(PORT);
}

setInterval(function () {
  var keys = dataExpirer.extractExpiredKeys();
  var len = keys.length;
  for (var i = 0; i < len; i++) {
    dataMap.remove(keys[i]);
  }
}, EXPIRY_ACCURACY);

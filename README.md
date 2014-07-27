nData
======

nData is a lightweight key-value store server and client pair.
It is written entirely in node.js for maximum portability.

## Installation

```bash
npm install ndata
```

## Overview

To use it call:
var ndata = require('ndata');

Firstly, launch a new nData server. If you're using the node cluster module, you might want to launch the nData server once 
from the master process and then interact with it using nData clients.

To launch the server, use:
var dataServer = ndata.createServer({port: 9000, secretKey: 'mySecretKey'})

The secretKey argument is optional; you should use it if you want to restrict access to the server.
If you're running a node cluster, you may want to use a random key and distribute it to all the workers so that only
your application can interact with the nData server.

Once the server is setup, you should create clients to interact with it. **Make sure that the server is running before creating clients; listen for the 'ready' event on the server.**
To create a client use:
var dataClient = ndata.createClient({port: 9000, secretKey: 'mySecretKey'});

The port and secret key must match those supplied to the createServer function.

The client exposes the following methods:
(Please see the section on keys (below) to see how you can use keys in nData.
Also, note that the callback argument in all of the following cases is optional.)

- run(code,[data,] callback) - Run a special JavaScript function declaration (code) as a query on the nData server - This function declaration accepts the DataMap as a parameter.
This is the most important function in nData, all the other functions are basically utility functions to make things quicker. Using run() offers the most flexibility.
The callback is in form: callback(err, data) Example:

```js
var queryFn = function (DataMap) {
	// The myMessage variable comes from queryFn.data
	DataMap.set(['main', 'message'], myMessage);
	return DataMap.get(['main']); 
};
queryFn.data = {
	myMessage: 'This is an important message'
};

client.run(queryFn, function(err, data) {
	console.log(data); // outputs {message: "This is an important message"}
});
```

Note that query functions are NOT regular functions. Query functions are executed remotely (on the nData server),
therefore, you cannot access variables from the outer parent scope while inside them :(
To pass data from the current process to use inside your query functions, you need to set them through the data 
property (see queryFn.data) in example above.
Properties of queryFn.data will be available as regular variables inside the query function when it gets executed on the server.
All query data is escaped automatically, so it's safe to supply user input. The queryFn.data property is optional.

- input(value) - Escapes user input to make it safe for use within the following functions. The value parameter can be any JSON-compatible object.

- set(keyChain, value, callback) - Set a key-value pair, when the operation has been completed, callback will be executed.
The callback is in form: callback(err)

- add(keyChain, value, callback) - Append a value at the given keyChain; the object at keyChain will be treated as an array. If a value already exists at that keyChain and is not an array,
this existing value will be placed inside an empty array and the specified value argument will be appended to that array.
The callback is in form: callback(err)

- concat(keyChain, value, callback) - Concatenate the array or object at keyChain with the specified array or object (value).
The callback is in form: callback(err)

- remove(keyChain,[getValue,] callback) - Remove the value at keyChain. If value is an array, it will remove the entire array.
The optional getValue is a boolean which indicates whether or not to get the removed value in the callback.
The callback is in form: callback(err, value)

- removeRange(keyChain, fromIndex,[ toIndex, getValue,] callback) - Remove a range of values at keyChain between fromIndex and toIndex.
This function assumes that the value at keyChain is an object or array. The optional getValue argument specifies whether or not to return the removed section as an argument to the callback.
The callback is in form: callback(err, value)

- removeAll(callback) - Clear nData completely.
The callback is in form: callback(err)

- pop(keyChain,[getValue,] callback) - Remove the last numerically-indexed entry at keyChain; callback is in the form: callback(err, value).
The optional getValue is a boolean which indicates whether or not to get the removed value in the callback.
The callback is in form: callback(err, value)

- get(keyChain, callback) - Get the value at keyChain; callback is in form: callback(err, value)

- getRange(keyChain, fromIndex,[ toIndex,] callback) - This function assumes that the value at keyChain is an Array or Object;
capture all values starting at fromIndex and finishing at toIndex (but not including toIndex).
If toIndex is not specified, all values from fromIndex until the end of the Array/Object will be included).
The callback is in form: callback(err, value)

- getAll(callback) - Get all the values in nData; callback is in form: callback(err, value)

- count(keyChain, callback) - Count the number of elements at keyChain; callback is in form: callback(err, value)

- subscribe(channel, ackCallback) - Watch a channel on nData. This is the nData equivalent to Redis' subscribe().
When an event happens on any watched channel, you can handle it using nDataClient.on('event', handler)

- unsubscribe(channel, ackCallback) - Unwatch the specified channel. If channel is not specified, it will unsubscribe from all channels.

- on(event, listener) - Listen to events on nData, you should listen to the 'message' event to handle messages from subscribed channels.

- publish(channel, message, callback) - Publish an event with the specified associated value.

## Keys

nData is very flexible with how you can use keys. It lets you set key chains of any dimension without having to manually create each link in the chain.

A key chain is an array of keys - Each subsequent key in the chain is a child of the previous key.
For example, consider the following object:
{'this': {'is': {'a': {'key': 123}}}}
The key chain ['this', 'is', 'a', 'key'] would reference the number 123.
The key chain ['this', 'is'] would reference the object {'a': {'key': 123}}, etc...

For example, when you start, nData will be empty, but this code is perfectly valid:
dataClient.set(['this', 'is', 'a', 'deep', 'key'], 'Hello world');

In this case, nData will create the necessary key chain and set the bottom-level 'key' to 'Hello World'.
If you were to call:
dataClient.get(['this', 'is', a'], function(value) {
	console.log(value);
});

The above would output: {deep:{key:'Hello world'}}

nData generally doesn't restrict you from doing anything you want. Following from the previous example, it is perfectly OK to call this:

dataClient.add(['this', 'is', 'a'], 'foo');

In this case, the key chain ['this', 'is', 'a'] would evaluate to:
{0:'foo',deep:{key:'Hello world'}}

In this case, nData will add the value at the next numeric index in the specified key path (which in this case is 0).
You can access numerically-indexed values like this:
dataClient.get(['this', 'is', 'a', 0], function(value) {
	console.log(value);
});

The output here will be 'foo'.
You can also add entire JSON-compatible objects as value.

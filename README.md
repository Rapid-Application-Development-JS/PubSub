PubSub
===========

Implementation of the `publisher-subscriber` pattern for building an application that uses **event bus** in the application architecture.

It allows not only to **deliver messages** to registered users through channels, but also **manage the delivery** using message types and priorities.

Advantages and differences:

* `sticky` messages - a sticky message will be sticked and delieverd in any case: either at once if the listener already exists, or immediately upon its registration.
* observers `priority` - observers' priorities; you may set the notification priorities of your observers.
* `ordered` messages - if a message is sent as `ordered`, an observer with a higher priority can cancel its further distribution simply by restoring **false**.
* you may set the context of the callback function execution for your observers.
* flexible mechanism `unsubscribe` - you may unsubscribe by `subscribe token`, you may unsubscribe from the channel and the callback method, from the channel and the context, or simply unsubscribe the context from all channels - depending on your particular need.
* tree-structured channels of message distribution - if you send a message to the channel **`level0.level1.level2`**, it will be first received by the subscribers of the channel **`level0`**, then **`level0.level1`**, and only then **`level0.level1.level2`**. Although, you may avoid this if you send a `rootless` message or a message to a channel that has no root.

##Use as a singleton:
Since the main goal is the setup of the message bus in the application, it's desirable for this bus to be a singleton in the application. 

```javascript
var pubsub = require("../pubsub.js");
```
Or simply in the browser:

```javascript
var pubsub = PubSub;
```

##Creating a new instance:
Although you may create several buses, we don't see much sense in it.

```javascript
var Constructor = require("../pubsub.js").Constructor;
var pubsub = new Constructor();
```
Or simply in the browser:

```javascript
var pubsub = new PubSub.Constructor();
```

## Methods
#### printLog
Takes **true/false** as the parameter. If set 'true', it writes the info about events and channels in the console.

```javascript
pubsub.printLog(flag);
```

#### channels
Returns the array of the existing message channels, to which listeners are subscribed.

```javascript
var channels  = pubsub.channels();
```

#### setSeparator
Sets a character or string, conveyed in the parameter **sprtr** for use as the separator of event subchannels.

```javascript
pubsub.setSeparator(sprtr);
```

#### publish
Publishes the message on **channel**, delivering the object **data** to subscribers. It is possible to use the message type **type**.

```javascript
pubsub.publish(channel, data, type);
```

Supported message types:

* `sticky` - the message will be delivered to all modules subscribed to events in the actual channel, then 'sticked' for delivering it to new subscribers later on. Only the latest sticky message is saved in the system.
* `ordered` - sends a message; you may stop its further distribution by returning **false** from the callback function of your observer. In case the message distribution is cancelled by the observer in the root channel, it will not be distributed to subchannels.
* `rootless` - sends a message only to a selected channel without its roots.

#### subscribe
Subscribes the callback fuction **fn** to execution in **context** upon receiving the message by **channel**.

If you have a further need of unsubscribing a certain observer from a certain channel with a certain context - you may save the token that is returned by the subscription, in order to further unsubscribe with its help.

```javascript
var token = pubsub.subscribe(channel, fn, context);
```
In order to set the priority of an observer, you must set the arrtibute `priority` in the callback function as any number which will define the priority - the higher the number, the higher the priority. If the attribute isn't set, the priority is minimal.

```javascript
function callback() {
	// do smth
}
callback.priority = 1;

pubsub.subscribe('my_channel', callback);
```
> Take notice that the attribute `priority` is deleted upon subscription; that's why its altering after the subscription to the channel does not affect priorities.

#### unsubscribe
Generally, unsubscription from a channel looks as follows:

```javascript
pubsub.unsubscribe(channel, fn, context);
```
Unsubscribes from **channel**; valid for the subscribers registered with the callback function **fn** in **context**.
 
However, you may as well use shortened notations:

>```javascript
pubsub.unsubscribe('some.channel', callback);
``` 

* Unsubscribes from **channel**; valid for the subscribers registered with the callback function **fn** without defined context.

>```javascript
pubsub.unsubscribe('some.channel', context);
```

* Unsubscribes from a selected channel; valid for the subscribers registered in **context**.

>```javascript
pubsub.unsubscribe(context);
```

* Unsubscribes from all channels; valid for all the subscribers registered in **context**.

>```javascript
pubsub.unsubscribe(channel);
```

Unsubscribes all subscribers from **channel**.

## Examples
### Basic example
```javacript
// create a function to subscribe to channel
var subscriber = function( channel, message ){
    console.log( channel, message );
};

// add the function to the list of subscribers for a particular channel
PubSub.subscribe( 'my_channel', mySubscriber );

// publish messsage to channel
PubSub.publish( 'my_channel', { attr: 1} );
```
### Advanced example
```javascript
// create subscriber
var subscriber = {
	handleMsg: function (channel, message) {
		console.log( channel, message );
	}
}

// subscribe to several channels
PubSub.subscribe( 'channel_1', subscriber.handleMsg, subscriber );
PubSub.subscribe( 'channel_2', subscriber.handleMsg, subscriber );

// do smth

//unsubscribe this subscriber via context
PubSub.unsubscribe(subscriber);
```

### Unsubscribe via token
```javascript
// create a callback function to receive the messages
function subscriber(channel, message ){
    console.log( channel, message );
};

// add the function to the list of subscribers to a particular channel
// we're keeping the returned token, in order to be able to unsubscribe
// from the chanel later on
var token = PubSub.subscribe( 'my_channel', subscriber );

// unsubscribe this subscriber via token
PubSub.unsubscribe( token );
```
You can also review simple examples of using it in the `test` folder.

##License
The MIT License (MIT)

Copyright (c) 2015 [Mobidev](http://mobidev.biz/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
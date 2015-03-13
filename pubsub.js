(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(function () {
            return (root.PubSub = factory());
        });
    } else if (typeof module === "object" && module.exports) {
        module.exports = (root.PubSub = factory());
    } else {
        root.PubSub = factory();
    }
}(this, function () {
    var pubsub;

    function PubSub() {
        var channels = {}, sticky = {}, debug = false, separator = '.';

        function log() {
            if (debug) {
                console.log(arguments);
            }
        }

        function isObject(testObj) {
            return Object.prototype.toString.call(testObj) === '[object Object]';
        }

        function sortByKey(array, key) {
            return array.sort(function (a, b) {
                var x = a[key];
                var y = b[key];

                if (x === undefined && y !== undefined) {
                    return 1;
                }
                if (x !== undefined && y === undefined) {
                    return -1;
                }

                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }

        function generateKey() {
            var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            var randomstring = new Array(16);

            for (var x = 0; x < 16; x++) {
                randomstring[x] = chars[Math.floor(Math.random() * chars.length)];
            }
            return randomstring.join('');
        }

        // Returns function which logic depends on passed arguments values.
        function createChecker(callback, contextObject) {
            if (callback && contextObject) {

                // compare by matching with both callback and context
                return function (subscriber, fn, context) {
                    return subscriber.callback === fn && subscriber.context === context;
                };
            }
            if (typeof callback === 'function') {

                // compare only by callback
                return function (subscriber, fn) {
                    return subscriber.callback === fn;
                };
            }
            // if only one parameter passed
            if (isObject(callback)) {

                // compare only by context
                return function (subscriber, context) {
                    return subscriber.context === context;
                };
            }

            return function () {
            };
        }

        function notify(currentChannel, args, type) {
            var i, l, subscription, prevent, receiver;

            if (channels[currentChannel])
                for (i = 0, l = channels[currentChannel].length; i < l; i += 1) {
                    subscription = channels[currentChannel][i];
                    prevent = subscription.callback.apply(subscription.context, args);

                    if (debug) {
                        receiver = subscription.context.options || subscription.context;
                        log("receiver:" + receiver.radID + " channel:" + currentChannel, args);
                    }

                    if (prevent === false && type === "ordered") {
                        return prevent;
                    }
                }
        }

        return {

            printLog: function (flag) {
                debug = flag;
                return this;
            },

            channels: function () {
                var result = [];
                for (var channel in channels) {
                    if (channels.hasOwnProperty(channel)) {
                        result.push(channel);
                    }
                }
                return result;
            },

            setSeparator: function (sprtr) {
                separator = sprtr;
                return this;
            },

            /**
             *
             * @param {string} channel  - channel to publish message, example - "network.getData"
             * @param [data] - any type of data
             * @param {string} [type] - "sticky"|"ordered"|"rootless"
             *
             * */
            publish: function (channel, data, type) {
                var index, length, parts = channel.split(separator), currentChannel;

                log(this.radID + " publish:", arguments);

                //attach sticky message
                if (type === "sticky") {
                    sticky[channel] = arguments;
                }

                //post message
                if (type === "rootless") {
                    notify(channel, arguments, type);
                } else {
                    for (index = 0, length = parts.length; index < length; index += 1) {
                        currentChannel = parts.slice(0, index + 1).join(separator);
                        if (notify(currentChannel, arguments, type) === false) {
                            break;
                        }
                    }
                }

                return this;
            },

            /**
             *
             * @param {string} channel - channel to publish message, example - "network.getData"
             * @param {function} fn - callback
             * @param {object} context - context for callback
             *
             * return 'token' for unsubscribe
             *
             * */
            subscribe: function (channel, fn, context) {

                if (!channel || typeof channel != 'string') {
                    console.log('Can\'t subscribe to channel, incorrect channel name:' + channel);
                    return;
                }

                if (typeof fn != 'function') {
                    console.log('Can\'t subscribe to channel, callback is not a function:' + fn);
                    return;
                }

                var cntx = context || this, priority = isNaN(fn.priority) ? undefined : fn.priority,
                    parts = channel.split(separator), token = generateKey(),
                    index, length, currentChannel;

                if (fn.priority) {
                    delete fn.priority;
                }

                channels[channel] = channels[channel] || [];
                channels[channel].push({context: cntx, callback: fn, priority: priority, token: token});
                channels[channel] = sortByKey(channels[channel], 'priority');

                log("subscribe to channel:" + channel, arguments);

                //post sticky messages
                for (index = 0, length = parts.length; index < length; index += 1) {
                    currentChannel = parts.slice(0, index + 1).join(separator);
                    if (sticky[currentChannel]) {
                        fn.apply(cntx, sticky[currentChannel]);
                    }
                }

                // post sticky messages for subchannels
                for (var key in sticky) {
                    if (sticky.hasOwnProperty(key)) {
                        index = key.indexOf(channel);
                        if (index == 0 && key.indexOf(channel + separator) === 0) {
                            fn.apply(cntx, sticky[key]);
                        }
                    }
                }
                return token;
            },

            /**
             * - .unsubscribe('some.channel', callback, context) - remove subscribers from 'some.channel', which was
             * registered with the same callback and context;
             * - .unsubscribe('some.channel', callback) - remove subscribers which have the same callback but no matter what context;
             * - .unsubscribe('some.channel', context)  - remove all subscribers form 'some.channel', which match context;
             * - .unsubscribe(context) - remove all subscribers which have the same context from all channels;
             * - .unsubscribe('some.channel') - remove all subscribers for this channel;
             * - .unsubscribe(token) - remove entry point;
             */
            unsubscribe: function (channel, fn, context) {
                var index,
                    subscribers,
                    channelName,
                    checkSubscriber;

                if (arguments.length == 0) {
                    return false;
                }

                // token case
                if (typeof channel === 'string' && !channels[channel]) {
                    for (channelName in channels) {
                        if (channels.hasOwnProperty(channelName)) {
                            subscribers = channels[channelName];

                            for (var i = 0, l = subscribers.length; i < l; i += 1) {
                                if (subscribers[i].token === channel) {
                                    channel = channelName;
                                    fn = subscribers[i].callback;
                                    context = subscribers[i].context;
                                    break;
                                }
                            }
                        }
                    }
                }

                // Remove subscriber from specific channel
                if (typeof channel === 'string' && channels[channel]) {

                    // Remove all subscribers from channel
                    if (!fn && !context) {
                        delete channels[channel];
                        return false;
                    }

                    // create check function which logic depends on passed arguments values
                    checkSubscriber = createChecker(fn, context);
                    subscribers = channels[channel];
                    index = subscribers.length;

                    while (index--) {
                        // Remove matched subscribers
                        if (checkSubscriber(subscribers[index], fn, context)) {
                            subscribers.splice(index, 1);
                        }
                    }
                    if (!channels[channel].length) {
                        delete channels[channel];
                    }
                    return false;
                }

                // Remove all subscribers with specified context if it was passed as a single argument.
                if (isObject(channel)) {
                    context = channel;
                    for (channelName in channels) {
                        if (channels.hasOwnProperty(channelName)) {

                            subscribers = channels[channelName];
                            index = subscribers.length;
                            while (index--) {
                                if (subscribers[index].context === context) {
                                    subscribers.splice(index, 1);
                                }
                            }
                            // remove channel if it empty
                            if (!subscribers.length) {
                                delete channels[channelName];
                            }
                        }
                    }

                }
            }
        };
    }

    pubsub = new PubSub();
    pubsub.Constructor = PubSub;

    return pubsub;
}));
var should = require("chai").should();
var pubsub = require("../pubsub.js");

describe('0.1: Base tests', function () {

    it('0.1.1: Channel: Subscribe -> Message -> Unsubscribe', function (done) {
        var counter = 0;

        function observer() {
            counter++;
        }

        pubsub.subscribe('channel', observer);
        pubsub.publish('channel');
        pubsub.unsubscribe('channel', observer);
        pubsub.publish('channel');

        setTimeout(function () {
            (counter).should.equal(1);
            done();
        }, 50);
    });

    it('0.1.2: Subchannel: Subscribe -> Message -> Unsubscribe', function (done) {
        var counter = 0;

        function observer() {
            counter++;
        }

        pubsub.subscribe('channel.subchannel', observer);
        pubsub.publish('channel.subchannel');
        pubsub.publish('channel');

        pubsub.unsubscribe('channel.subchannel', observer);
        pubsub.publish('channel.subchannel');

        setTimeout(function () {
            (counter).should.equal(1);
            done();
        }, 50);
    });

    it('0.1.3: Rootchannel: Subscribe -> Message -> Unsubscribe', function (done) {
        var counter = 0;

        function observer() {
            counter++;
        }

        pubsub.subscribe('channel', observer);
        pubsub.publish('channel.subchannel');

        pubsub.unsubscribe('channel', observer);
        pubsub.publish('channel.subchannel');

        setTimeout(function () {
            (counter).should.equal(1);
            done();
        }, 50);
    });

    it('0.1.4: Adjacent channel: Subscribe -> Message -> Unsubscribe', function (done) {
        var counter = 0, counter2 = 0;

        function observer() {
            counter++;
        }

        function observer2() {
            counter2++;
        }

        pubsub.subscribe('channel', observer);
        pubsub.subscribe('channel2', observer2);

        pubsub.publish('channel');
        pubsub.publish('channel2');

        pubsub.unsubscribe('channel', observer);
        pubsub.unsubscribe('channel2', observer2);
        pubsub.publish('channel');
        pubsub.publish('channel2');

        setTimeout(function () {
            (counter).should.equal(1);
            (counter2).should.equal(1);
            done();
        }, 50);
    });
});

describe('0.2: Advanced tests', function () {

    it('0.2.1: Data transfer', function (done) {
        var object = {};

        function observer(channel, data) {
            (data).should.equal(object);
            done();
        }

        pubsub.subscribe('channel', observer);
        pubsub.publish('channel', object);
        pubsub.unsubscribe('channel', observer);
    });

    it('0.2.2: Context', function (done) {
        var object = {}, context = {name: 'context'};

        function observer(channel, data) {
            (data).should.equal(object);
            (this).should.equal(context);

            done();
        }

        pubsub.subscribe('channel', observer, context);
        pubsub.publish('channel', object);
        pubsub.unsubscribe('channel', observer);
    });

    it('0.2.3: Context unsubscribe', function (done) {
        var counter = 0, context = {name: 'context'};

        function observer() {
            counter++;
        }

        pubsub.subscribe('channel', observer, context);
        pubsub.subscribe('channel2', observer, context);

        pubsub.publish('channel');
        pubsub.publish('channel2');

        pubsub.unsubscribe(context);

        pubsub.publish('channel');
        pubsub.publish('channel2');

        setTimeout(function () {
            (counter).should.equal(2);
            done();
        }, 50);
    });

    it('0.2.4: Channel name', function (done) {
        function observer(channel) {
            (channel).should.equal('channel.subchannel');

            pubsub.unsubscribe('channel', observer);
            done();
        }

        pubsub.subscribe('channel', observer);
        pubsub.publish('channel.subchannel');
    });

    it('0.2.5: Sticky message', function (done) {
        var message = {}, message2 = {type: 'nonsticky'};

        function observer(channel, data) {
            (data).should.equal(message);

            pubsub.unsubscribe('stickychannel', observer);
            done();
        }

        pubsub.publish('stickychannel', message, 'sticky');
        pubsub.publish('stickychannel', message2);

        pubsub.subscribe('stickychannel', observer);
    });

    it('0.2.6: Channel separator', function (done) {
        var counter = 0;

        function observer() {
            counter++;
        }

        pubsub.setSeparator('::');

        pubsub.subscribe('channel', observer);
        pubsub.publish('channel::subchannel');

        pubsub.unsubscribe('channel', observer);
        pubsub.publish('channel::subchannel');

        setTimeout(function () {
            (counter).should.equal(1);

            pubsub.setSeparator('.');

            done();
        }, 50);
    });

    it('0.2.7: Priority', function (done) {
        var sequense = '';

        function observer() {
            sequense += 'undefined';
        }

        function observer0() {
            sequense += '0';
        }

        observer0.priority = 0;

        function observer1() {
            sequense += '1';
        }

        observer1.priority = 1;

        pubsub.subscribe('channel', observer);
        pubsub.subscribe('channel', observer1);
        pubsub.subscribe('channel', observer0);

        pubsub.publish('channel');

        pubsub.unsubscribe('channel', observer0);
        pubsub.unsubscribe('channel', observer);
        pubsub.unsubscribe('channel', observer1);

        setTimeout(function () {
            (sequense).should.equal('01undefined');
            done();
        }, 50);
    });

    it('0.2.8: Ordered', function (done) {
        var sequense = '';

        function observer() {
            sequense += 'undefined';
        }

        function observer0() {
            sequense += '0';
        }

        observer0.priority = 0;

        function observer1() {
            sequense += '1';

            return false;
        }

        observer1.priority = 1;

        pubsub.subscribe('channel', observer);
        pubsub.subscribe('channel', observer1);
        pubsub.subscribe('channel', observer0);

        pubsub.publish('channel', null, 'ordered');

        pubsub.unsubscribe('channel', observer0);
        pubsub.unsubscribe('channel', observer);
        pubsub.unsubscribe('channel', observer1);

        setTimeout(function () {
            (sequense).should.equal('01');
            done();
        }, 50);
    });

    it('0.2.9: Ordered subchannels', function (done) {
        var sequense = '';

        function observer() {
            sequense += 'undefined';
        }

        function observer0() {
            sequense += '0';
        }

        observer0.priority = 0;

        function observer1() {
            sequense += '1';

            return false;
        }

        observer1.priority = 1;

        pubsub.subscribe('channel.subchannel', observer);
        pubsub.subscribe('channel', observer1);
        pubsub.subscribe('channel', observer0);

        pubsub.publish('channel.subchannel', null, 'ordered');

        pubsub.unsubscribe('channel', observer0);
        pubsub.unsubscribe('channel.subchannel', observer);
        pubsub.unsubscribe('channel', observer1);

        setTimeout(function () {
            (sequense).should.equal('01');
            done();
        }, 50);
    });

    it('0.2.10: Rootless', function (done) {
        var counter = 0;

        function observer() {
            counter++;
        }

        pubsub.subscribe('channel', observer);
        pubsub.publish('channel.subchannel', null, 'rootless');

        pubsub.unsubscribe('channel', observer);
        pubsub.publish('channel.subchannel');

        setTimeout(function () {
            (counter).should.equal(0);
            done();
        }, 50);
    });

    it('0.2.11: Token', function (done) {
        var counter = 0;

        function observer() {
            counter++;
        }

        var token = pubsub.subscribe('channel', observer);

        pubsub.publish('channel');

        pubsub.unsubscribe(token);
        pubsub.publish('channel');

        setTimeout(function () {
            (counter).should.equal(1);
            done();
        }, 50);
    });

});
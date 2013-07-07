(function (global, extend) {
  'use strict';

  function simpleQueue(list, opts) {
    var flushing = false
      , me
      ;

    opts = extend({
      timeout: 5000
    , retryDelay: 500
    , retryLimit: 3
    }, opts);

    list = list || [];

    me = {
      opts: opts

    , enqueue: function () {
        var args = Array.prototype.slice.call(arguments)
          , i, ii
          ;

        for (i = 0, ii = args.length; i < ii; i++) {
          list.push(args[i]);
        }

        me.onEnqueue(list);
      }

    , dequeue: function (callback) {
        var value = list.shift();
        me.onDequeue(list);

        return value;
      }

    , peek: function () {
        return list[0];
      }

    , flush: function (callback) {
        if (flushing === true) { return; }
        var timer
          , fails = 0
          ;

        flushing = true;

        function process() {
          if (me.hasAny()) {
            timer.reset();

            try {
              callback(me.peek(), next, fail);
            } catch (e) {
              fail(e);
            }
          } else {
            timer.destroy();
            flushing = false;
            me.onFlush(me);
          }
        }

        function next() {
          me.dequeue();
          simpleQueue.onNext(me.peek());
          process();
        }

        function fail(message) {
          fails += 1;
          simpleQueue.onFail(fails);

          if (fails <= opts.retryLimit) {
            opts.retryDelay ? me.timeout(process, opts.retryDelay) : process();
          } else {
            fails = 0;
            next();
          }
        }

        timer = me.timeout(fail, opts.timeout);
        process();
      }

    , timeout: function (fn, time) {
        var timer
          , me
          , running
          ;

        function set() {
          running = true;
          timer = window.setTimeout(fn, time);
        }

        set();

        return me = {
          reset: function () {
            me.destroy();
            set();
          }

        , isRunning: function () {
            return running;
          }


        , destroy: function () {
            running = false;
            window.clearTimeout(timer);
          }
        };
      }

    , all: function () {
        return list;
      }

    , hasAny: function () {
        return list.length > 0;
      }

      // events
    , onFlush: function (me) {
      }

    , onEnqueue: function (list) {
      }

    , onDequeue: function (list) {
      }
    };

    return me;
  }

  simpleQueue.onFail = function (failsCount) {};
  simpleQueue.onNext = function (nextItem) {};

  global.simpleQueue = simpleQueue;
}(this, $.extend));

/*jshint laxcomma:true */
(function (g) {
  'use strict';

  function queryParam(name) {
    var r = new RegExp(name + "=([a-zA-Z-0-9]+)")
      , m = document.location.search.match(r)
      ;

    return m && m[1];
  }

  function follow($el, following) {
    var me
      , loading = false
      , showLoading = queryParam('noload') !== null ? false : true
      ;
    me = {
      toggle: function () {
        following = !following;
      }

    , loading: function (val) {
        val !== undefined && (loading = val);
        return loading;
      }

    , following: function (val) {
        val !== undefined && (following = val);
        return following;
      }

    , render: function (current) {
        current = current === undefined ? following : current;
        $el.toggleClass('loading', loading);
        $el.toggleClass('following', following);
      }

    , startLoad: function () {
      }

    , endLoad: function () {
        loading = false;
        me.render(following);
      }

    , save: function () {
        loading = true;
        me.toggle();
        me.render(following);

        ajax('success', function () {
          loading = false;
          me.render();
        }, function () {
          loading = false;
          me.render();
        });
      }
    };

    $el.on('click', function () { me.save(); });
    return me;
  }

  function ajax(url, success, failure) {
    var delay = queryParam('d') || 1000, possibleQueues = {
      good: [
        { delay: 0, state: 'sending' }
      , { delay: delay, state: 'updating' }
      , { delay: delay, state: 'receiving' }
      , { delay: delay, state: 'done' }
      , { delay: 0, method: success }
      ]

    , badserver: [
        { delay: 0, state: 'sending' }
      , { delay: delay, state: 'updating' }
      , { delay: delay, state: 'broken-server' }
      ]

    , badnetwork: [
        { delay: 0, state: 'sending' }
      , { delay: delay, state: 'updating' }
      , { delay: delay, state: 'receiving' }
      , { delay: delay, state: 'broken-network' }
      ]
    }
    , queueVersion = queryParam('v') || 'good'
    , $el = $('#ajax')
    , state = null
    , setState = function (newState) {
        $el.removeClass(state);
        $el.addClass(newState);
        state = newState;
      }
    , handler = function (data, next) {
      g.setTimeout(function () {
        if (data.state) {
          setState(data.state);
        }

        if (data.method) {
          data.method();
        }

        next();
      }, data.delay);
    };

    g.simpleQueue(possibleQueues[queueVersion].slice(0)).flush(handler);
  }

  follow($('#x-follow-button'));
  queryParam('hide') && $('#ajax').hide();
}(this));

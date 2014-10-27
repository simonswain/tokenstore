"use strict";

var async = require('async');
var tokens = require('../lib').api();

var myToken, forcedToken;
var myAttrs = {
  foo: 'bar'
};

var myOwner = 'testowner';

var token = {
  owner_id: 'testowner',
  attrs: {
    foo: 'bar'
  }
};

var forcedToken = {
  key: 'forced678901234567890123',
  owner_id: 'testowner',
  attrs: {
    ping: 'pong'
  }
};

exports.api = {

  'reset': function(test) {
    tokens.reset(function() {
      test.done();
    });
  },

  'get-not-found': function(test) {
    test.expect(2);
    tokens.get(
      '012345678901234567890123',
      function(err, res) {
        test.equal(err, null);
        test.equal(res, false);
        test.done();
      });
  },

  'add': function(test) {
    test.expect(4);
    tokens.add(
      token,
      function(err, res) {
        myToken = res;
        test.equal(err, null);
        test.equal(typeof res, 'object');
        test.equal(res.key.length, 24);
        test.ok(res.hasOwnProperty('id'));
        test.done();
      });
  },

  'get-by-id': function(test) {
    test.expect(6);
    tokens.get(
      myToken.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(typeof res, 'object');
        test.deepEqual(res.id, myToken.id);
        test.deepEqual(res.key, myToken.key);
        test.deepEqual(res.owner_id, token.owner_id);
        test.deepEqual(res.attrs, myAttrs);
        test.done();
      });
  },

  'get-by-key': function(test) {
    test.expect(6);
    tokens.getKey(
      token.key,
      function(err, res) {
        test.equal(err, null);
        test.equal(typeof res, 'object');
        test.deepEqual(res.id, myToken.id);
        test.deepEqual(res.key, myToken.key);
        test.deepEqual(res.owner_id, token.owner_id);
        test.deepEqual(res.attrs, myAttrs);
        test.done();
      });
  },

  'set-attrs': function(test) {
    test.expect(1);
    myAttrs.baz = 'quxx';
    tokens.setAttrs(
      myToken.id,
      myAttrs,
      function(err, res) {
        test.equal(err, null);
        test.done();
      });
  },

  'get-changed-attrs': function(test) {
    test.expect(2);
    tokens.get(
      myToken.id,
      function(err, res) {
        test.equal(err, null);
        test.deepEqual(res.attrs, myAttrs);
        test.done();
      });
  },

  'add-forced-id': function(test) {
    test.expect(6);
    tokens.add(
      forcedToken,
      function(err, res) {
        test.equal(err, null);
        test.equal(typeof res, 'object');
        test.deepEqual(res.id, forcedToken.id);
        test.deepEqual(res.key, forcedToken.key); // should be same
        test.deepEqual(res.owner_id, forcedToken.owner_id);
        test.deepEqual(res.attrs, forcedToken.attrs);
        test.done();
      });
  },

  'owner-list': function(test) {
    tokens.list(
      myOwner,
      function(err, res) {
        test.equal(err, null);
        test.equal(typeof res, 'object');
        test.equals(res.length, 2);
        test.done();
      });
  },

  // clear all tokens
  'reset-again': function(test) {
    tokens.reset(function() {
      test.done();
    });
  },

  // should be no token
  'reset-get': function(test) {
    test.expect(2);
    tokens.get(
      myToken.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(res, false);
        test.done();
      });
  },

  'quit': function(test) {
    tokens.quit(function() {
      test.done();
    });
  }

};

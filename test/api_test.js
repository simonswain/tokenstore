"use strict";

var async = require('async');
var tokens = require('../lib').api();

var myToken, forcedToken;
var myAttrs = {
  foo: 'bar'
};

var myOwner = 'testowner';

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
    test.expect(2);
    tokens.add(
      myOwner,
      myAttrs,
      function(err, res) {
        myToken = res;
        test.equal(err, null);
        test.equal(res.length, 24);
        test.done();
      });
  },

  'get': function(test) {
    test.expect(2);
    tokens.get(
      myToken,
      function(err, res) {
        test.equal(err, null);
        test.deepEqual(res, myAttrs);
        test.done();
      });
  },

  'get-owner': function(test) {
    test.expect(2);
    tokens.owner(
      myToken,
      function(err, res) {
        test.equal(err, null);
        test.deepEqual(res, myOwner);
        test.done();
      });
  },

  'set': function(test) {
    test.expect(1);
    myAttrs.baz = 'quxx';
    tokens.set(
      myToken,
      myAttrs,
      function(err, res) {
        test.equal(err, null);
        test.done();
      });
  },

  'set-get': function(test) {
    test.expect(2);
    tokens.get(
      myToken,
      function(err, res) {
        test.equal(err, null);
        test.deepEqual(res, myAttrs);
        test.done();
      });
  },

  'add-forced-id': function(test) {
    test.expect(2);
    forcedToken = 'forced678901234567890123';
    tokens.add(
      myOwner,
      forcedToken,
      myAttrs,
      function(err, res) {
        test.equal(err, null);
        test.equal(res, forcedToken);
        test.done();
      });
  },

  'get-forced-id': function(test) {
    test.expect(2);
    tokens.get(
      forcedToken,
      function(err, res) {
        test.equal(err, null);
        test.deepEqual(res, myAttrs);
        test.done();
      });
  },

  'get-owner-forced-': function(test) {
    test.expect(2);
    tokens.owner(
      forcedToken,
      function(err, res) {
        test.equal(err, null);
        test.deepEqual(res, myOwner);
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
      myToken,
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

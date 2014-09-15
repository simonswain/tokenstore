"use strict";

var async = require('async');
var tokens = require('../lib')();

var myToken, forcedToken;
var myAttrs = {
  foo: 'bar'
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
    test.expect(2);
    tokens.add(
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
  'add-id': function(test) {
    test.expect(2);
    forcedToken = 'forced678901234567890123';
    tokens.add(
      forcedToken,
      myAttrs,
      function(err, res) {
        test.equal(err, null);
        test.equal(res, forcedToken);
        test.done();
      });
  },
  'get-id': function(test) {
    test.expect(2);
    tokens.get(
      forcedToken,
      function(err, res) {
        test.equal(err, null);
        test.deepEqual(res, myAttrs);
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

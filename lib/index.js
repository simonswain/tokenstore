"use strict";

var async = require('async');
var Redis = require('redis');
var uid = require('uid2');

module.exports = function(opts){

  opts = opts || {};

  var env = process.env.NODE_ENV || 'development';

  if(!opts.redis){
    opts.redis = {
      host: '127.0.0.1',
      port: 6379,
      prefix: env
    };
  }

  if(!opts.prefix){
    opts.prefix = 'token';
  }

  if(!opts.size){
    opts.size = 24;
  }

  var redis = Redis.createClient(
    opts.redis.port, 
    opts.redis.host
  );

  var api = {};

  var makeKey = function(id){
    return opts.redis.prefix + ':' + opts.prefix + ':' + id;
  };

  // api methods

  // create a new token
  
  // supply an id to force use of that specific id. id must comply
  // with length. use when regenerating ids if case of redis rebuild

  api.add = function(id, attrs, next) {

    if(arguments.length === 3){
      if(id.length !== opts.size){
        return next(new Error('invalid token length'));
      }
    }

    if(arguments.length === 2){
      attrs = arguments[0];
      next = arguments[1];
      id = uid(opts.size);
    }

    api.set(id, attrs, next);
  };


  // update a token's attrs
  api.set = function(id, attrs, next) {   
    var key = makeKey(id);
    var json = JSON.stringify(attrs);
    redis.set(key, json, function(err){
      if(err){
        return next(err);
      }
      next(null, id);
    });
  };


  api.get = function(id, next) {
    var key = makeKey(id);
    redis.get(key, function(err, data){
      if(err){
        return next(err);
      }
      if(!data){
        return next(null, false);
      }
      data = data.toString();
      try {
        data = JSON.parse(data); 
      } catch (err) {
        return next(err);
      }
      return next(null, data);
    });
  };


  // delete a token
  api.del = function(id, next) {
    var key = makeKey(id);
    redis.del(key, next);
  };


  // flush all tokens
  api.reset = function(next) { 
    // get all tokens and delete
    var key = makeKey('*');
    redis.keys(key, function(err, list){
      if(err){
        return next(err);
      }
      if(!list) {
        return next();
      }
      var delKey = function(x, cb){
        var id = x.split(':')[2];
        api.del(id, cb);
      };
      async.eachSeries(list, delKey, next);
    });
  };


  // cleanup for exit
  api.quit = function(next) {
    redis.quit();
    next();
  };

  // export the api methods
  return api;

};

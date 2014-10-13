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

  var makeKey = function(suffix){
    return opts.redis.prefix + ':' + opts.prefix + ':' + suffix;
  };

  // api methods

  // create a new token

  // supply an id to force use of that specific id. id must comply
  // with length. use when regenerating ids if case of redis rebuild

  api.add = function(owner_id, token_id, attrs, done) {

    if(arguments.length === 4){
      owner_id = arguments[0];
      token_id = arguments[1];
      attrs = arguments[2];
      done = arguments[3];

      if(token_id.length !== opts.size){
        return done(new Error('invalid token length'));
      }
    }

    if(arguments.length === 3){
      owner_id = arguments[0];
      attrs = arguments[1];
      done = arguments[2];

      token_id = uid(opts.size);
    }

    var set = function(next){
      api.set(token_id, attrs, next);
    };

    // list of tokens owned by
    var addList = function(next){
      var key = makeKey('list:' + owner_id);
      redis.sadd(key, token_id, next);
    };

    // allow reverse lookup from token to owner
    var addOwner = function(next){
      var key = makeKey('owner:' + token_id);
      redis.set(key, owner_id, next);
    };

    async.series([
      set,
      addList,
      addOwner
    ], function(){
      done(null, token_id);
    });

  };

  // update a token's attrs
  api.set = function(token_id, attrs, done) {
    var key = makeKey('id:' + token_id);
    var json = JSON.stringify(attrs);
    redis.set(key, json, function(err){
      if(err){
        return done(err);
      }
      done(null, token_id);
    });
  };


  api.get = function(token_id, done) {
    var key = makeKey('id:' + token_id);
    redis.get(key, function(err, data){
      if(err){
        return done(err);
      }
      if(!data){
        return done(null, false);
      }
      data = data.toString();
      try {
        data = JSON.parse(data);
      } catch (err) {
        return done(err);
      }
      return done(null, data);
    });
  };


  api.owner = function(token_id, done) {
    var key = makeKey('owner:' + token_id);
    var owner_id;
    redis.get(key, function(err, data){
      if(err){
        return done(err);
      }

      if(!data){
        return done(null, false);
      }

      owner_id = data;
      return done(null, owner_id);
    });
  };



  // find all tokens owned by onber_id
  api.list = function(owner_id, done) {

    var list;
    var tokens = [];

    var getList = function(next){
      var key = makeKey('list:' + owner_id);
      redis.smembers(
        key,
        function(err, res){
          list = res;
          next();
        });
    };

    var getKey = function(x, next){
      api.get(x, function(err, attrs){
        tokens.push({
          id: x,
          attrs: attrs
        });
        next();
      });
    };

    var getKeys = function(next){
      async.eachSeries(
        list,
        getKey,
        function(err){
          next(null, tokens);
        });
    };

    async.series([
      getList,
      getKeys
    ], function(err){
      done(null, tokens);
    });

  };


  // delete a token
  api.del = function(token_id, done) {

    var owner_id;

    var getOwner = function(next){
      var key = makeKey('owner:' + token_id);
      redis.get(key, function(err, res){
        owner_id = res;
        next();
      });
    };

    var remList = function(next){
      var key = makeKey('list:' + owner_id);
      redis.srem(key, token_id, next);
    };

    var delKey = function(next){
      var key = makeKey('id:' + token_id);
      redis.del(key, next);
    };

    var delReverse = function(next){
      var key = makeKey('owner:' + token_id);
      redis.del(key, next);
    };

    async.series([
      getOwner,
      remList,
      delReverse,
      delKey,
    ], function(){
      done(null, token_id);
    });

  };


  // flush all tokens
  api.reset = function(done) {
    // get all tokens and delete
    var key = makeKey('id:*');

    redis.keys(key, function(err, list){

      if(err){
        return done(err);
      }

      if(!list) {
        return done();
      }

      var delKey = function(x, cb){
        var path = x.split(':');
        var id = path[path.length-1];
        api.del(id, cb);
      };

      async.eachSeries(list, delKey, done);

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

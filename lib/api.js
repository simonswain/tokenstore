"use strict";

var async = require('async');
var Redis = require('redis');

var uid = require('uid2');
var uuid = require('node-uuid');

module.exports = function(opts){

  opts = opts || {};

  var env = process.env.NODE_ENV || 'development';

  if(!opts.redis){
    opts.redis = {
      host: '127.0.0.1',
      port: 6379
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

  var makeKey = function(suffix){
    return opts.prefix + ':' + suffix;
  };

  // api methods

  // create a new token

  // supply an id to force use of that specific key. id must comply
  // with length. use when regenerating ids if case of redis rebuild

  // when retrieving or storing a token in Redis it looks like this, stored
  // stringified, parsed when fetched.

  // { key: 'uid2', 'id: 'uuidv4', owner_id: 'xxx', attrs: {} }

  var api = {};

  // adding a token you'll pass something like this

  // { owner_id: 'xxx', attrs: {} }

  // you can optionally provide a specific key if you want that used for
  // the token, otherwise one will be created for you.

  // attrs are where you are expected to store your token-specific data

  api.add = function(token, done) {

    if(!token.hasOwnProperty('key')){
      token.key = uid(opts.size);
    }

    if(token.key.length !== opts.size){
      return done(new Error('invalid token length'));
    }

    // token data is stored by key for quickest lookup.

    // reverse lookup is provided from token_id to key, and for list
    // of token_id's that belong to each owner_id

    token.id = uuid.v4();
    
    // need to add the reverse lookups first, ready for set
    
    // for lookup key by token_id
    var addId = function(next){
      var key = makeKey('id:' + token.id);
      redis.set(key, token.key, next);
    };

    // add to list of tokens owned by user_id
    var addList = function(next){
      var key = makeKey('tokens:' + token.owner_id);
      redis.sadd(key, token.id, next);
    };

    // store token data by key
    var set = function(next){
      var key = makeKey('key:' + token.key);
      var json = JSON.stringify(token);
      redis.set(
        key, 
        json, 
        function(err){
          if(err){
            return next(err);
          }
          next();
        });
    };

    async.series([
      addId,
      addList,
      set
    ], function(){
      done(null, token);
    });

  };

  // update a token's attrs, leaving other data intact

  // get then set

  api.setAttrs = function(token_id, attrs, done) {

    var token;

    var getId = function(next){
      api.get(
        token_id, 
        function(err, res){
          if(!res){
            return new Error('not-found');
          }
          token = res;
          next();
        });
    };

    var changeAttrs = function(next){
      token.attrs = attrs;
      next();
    };

    // store token data by key
    var set = function(next){
      var key = makeKey('key:' + token.key);
      var json = JSON.stringify(token);
      redis.set(
        key, 
        json, 
        function(err){
          if(err){
            return next(err);
          }
          next();
        });
    };

    async.series([
      getId,
      changeAttrs,
      set,
    ], function(){
      done();
    });

  };


  // get token by token_id
  api.get = function(token_id, done) {
    var key = makeKey('id:' + token_id);
    redis.get(
      key, 
      function(err, data){
        if(err){
          return done(err);
        }
        if(!data){
          return done(null, false);
        }

        // found our token key
        var tokenKey = data.toString();

        // get by key and return
        api.getKey(tokenKey, done);

      });
  };


  // get token by key
  api.getKey = function(tokenKey, done) {
    var key = makeKey('key:' + tokenKey);
    redis.get(
      key, 
      function(err, data){
        if(err){
          return done(err);
        }
        if(!data){
          return done(null, false);
        }
        // stringified token json
        data = data.toString();
        try {
          data = JSON.parse(data);
        } catch (err) {
          return done(err);
        }
        // data is token
        return done(null, data);
      });
  };

  // find all tokens owned by onber_id
  api.list = function(owner_id, done) {

    var list;
    var tokens = [];

    var getList = function(next){
      var key = makeKey('tokens:' + owner_id);
      redis.smembers(
        key,
        function(err, res){
          list = res;
          next();
        });
    };

    var getId = function(x, next){
      api.get(x, function(err, token){
        tokens.push(token);
        next();
      });
    };

    var getIds = function(next){
      async.eachSeries(
        list,
        getId,
        function(err){
          next(null, tokens);
        });
    };

    async.series([
      getList,
      getIds
    ], function(err){
      done(null, tokens);
    });

  };


  // delete a token
  api.del = function(token_id, done) {

    var token;

    var get = function(next){
      api.get(
        token_id, 
        function(err, res){
          token = res;
          next();
        });
    };

    var remList = function(next){
      var key = makeKey('tokens:' + token.owner_id);
      redis.srem(key, token_id, next);
    };

    var delId = function(next){
      var key = makeKey('id:' + token.id);
      redis.del(key, next);
    };

    var delKey = function(next){
      var key = makeKey('key:' + token.key);
      redis.del(key, next);
    };

    async.series([
      get,
      remList,
      delId,
      delKey,
    ], function(){
      done();
    });

  };

  // delete a token by key
  api.delKey = function(tokenKey, done) {

    var token;

    var getKey = function(next){
      api.getKey(
        tokenKey, 
        function(err, res){
          token = res;
          next();
        });
    };

    var delId = function(next){
      api.del(
        token.id, 
        function(err, res){
          next();
        });
    };

    async.series([
      getKey,
      delId,
    ], function(){
      done();
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

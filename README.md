# Tokenstore

Version: 0.0.w

[![Build Status](https://travis-ci.org/simonswain/tokenstore.png)](https://travis-ci.org/simonswain/tokenstore)

## API

All methods take a callback that is called with err and result. The
signatures below use `next` to identify the callback.

* [`reset`](#reset)
* [`quit`](#quit)

* [`add`](#add)
* [`set`](#set)
* [`get`](#get)
* [`del`](#del)
* [`owner`](#owner)
* [`list`](#list)


<a name="reset" />
### reset(done)

<a name="quit" />
### quit(done)


<a name="add" />
### add(owner_id, [token_id, ] attrs, done)

<a name="get" />
### get(token_id)

<a name="del" />
### del(token_id)

<a name="owner" />
### owner(token_id)

<a name="list" />
### list(owner_id)


## License

Copyright (c) 2014 Simon Swain

Licensed under the MIT license.

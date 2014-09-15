#!/bin/bash

NODE_ENV=test ./node_modules/nodeunit/bin/nodeunit -t $1

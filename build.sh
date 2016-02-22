#!/bin/bash -e

mkdir -p build
node apps/map.js -e ./build/
webpack -p

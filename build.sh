#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}"  )" >/dev/null 2>&1 && pwd  )"
BUILD=$DIR/build
TMP=$BUILD/TooManyTabs
pushd $DIR

rm -rf $BUILD
mkdir -p $TMP

cp manifest.json $TMP
cp popup.html $TMP
cp popup.js $TMP
cp icon.png $TMP
cp bg.html $TMP
cp -r js $TMP
cp -r css $TMP
cp -r fonts $TMP

pushd $BUILD
zip -r TooManyTabs.zip TooManyTabs
popd

popd

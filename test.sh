#!/usr/bin/env bash

set -o errexit

yarn

pushd packages/extract
yarn build
yarn test
yarn start
popd

pushd packages/joplin-plugin
yarn test
yarn pack --filename ../test/joplin-plugin.tgz
popd

pushd packages/test
yarn
yarn build
popd

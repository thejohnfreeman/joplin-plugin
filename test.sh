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
yarn pack --filename ../joplin-plugin.tgz
popd

for dir in packages/test*; do
  pushd ${dir}
  yarn
  yarn build
  popd
done

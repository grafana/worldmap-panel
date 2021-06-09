# Hacking on the Grafana Map Panel

## Introduction
The easiest way to get started is to git clone the project repository 
directly into the `data/plugins` of your Grafana instance followed
by building it there.

Grafana will read in the `dist` folder first. So, to see your changes in 
Grafana, you will have to build the plugin once. However, you do not 
need to restart your local Grafana server after every change, just 
refreshing the page will be sufficient.

## Sandbox setup
The easiest way to invoke a development sandbox is by using Docker.
```shell
# Run with Grafana 7
docker run --publish=3000:3000 --volume=$PWD/dist:/var/lib/grafana/plugins/grafana-map-panel grafana/grafana:7.5.7

# Run with Grafana 8
docker run --publish=3000:3000 --volume=$PWD/dist:/var/lib/grafana/plugins/grafana-map-panel --env=GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=grafana-map-panel grafana/grafana:8.0.0
```

Because the version of `node-sass` used as transitive dependency is apparently
not compatible with Node 16 yet, let's use Node 15:
```shell
brew install nodeenv
nodeenv --node=15.14.0 .nenv
source .nenv/bin/activate
```

## General
- Display all tasks from `grafana-toolkit`: `npx grafana-toolkit --help`

## Development
- Install packages: `npx yarn install`
- Bundle plugin in dev mode: `npx yarn dev`
- Bundle plugin in dev mode and start a watcher: `npx yarn watch`
- Upgrade dependencies: `npx yarn upgrade`
- Run all tests: `npx yarn test`
- Run specific tests: `npx yarn test --testNamePattern "when some fields"`

## Before submitting a pull request
- Make sure your improvement gets accompanied by a corresponding test case
- Run linter/prettier: `npx grafana-toolkit plugin:dev`

## Release
1. Install packages: `npx yarn install`
2. Bump version within `package.json` and update `CHANGELOG.md` 
3. Commit changes
4. Tag repository: `git tag 0.xx.0`
5. Push repository: `git push && git push --tags`
6. Build plugin:
   - `npx grafana-toolkit plugin:ci-build`
   - `npx grafana-toolkit plugin:ci-build --finish`
7. Create zip package: `npx grafana-toolkit plugin:ci-package`
   When this process succeeds, packages can be found within the `ci/packages/` folder.
   The `Error signing manifest` warning can optionally be ignored, YMMV.

Steps 6. and 7. can be shortened by invoking `make package publish`.

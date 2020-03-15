# Hacking on the Grafana Map Panel

## Introduction
The easiest way to get started is to git clone the project repository 
directly into the `data/plugins` of your Grafana instance followed
by building it there.

Grafana will read in the `dist` folder first. So, to see your changes in 
Grafana, you will have to build the plugin once. However, you do not 
need to restart your local Grafana server after every change, just 
refreshing the page will be sufficient.

## General
1. Display all tasks from `grafana-toolkit`: `npx grafana-toolkit --help`

## Development
1. Install packages: `npx yarn install`
2. Bundle plugin in dev mode: `npx yarn dev`
3. Bundle plugin in dev mode and start a watcher: `npx yarn watch`
4. Run the tests before submitting a PR: `npx yarn test`
5. Run specific tests: `npx yarn test --testNamePattern "when some fields"`

# Building the Grafana Map Panel
1. Install packages: `npx yarn install`
2. Build into `dist/`, lint and run tests: `npx yarn build`
3. Build plugin on CI: `npx grafana-toolkit plugin:ci-build`
4. Create a zip package: `npx grafana-toolkit plugin:ci-package`
   When this process succeeds, packages can be found within the `ci/packages/` folder.

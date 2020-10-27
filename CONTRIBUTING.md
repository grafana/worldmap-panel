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
- Display all tasks from `grafana-toolkit`: `npx grafana-toolkit --help`

## Development
- Install packages: `npx yarn install`
- Bundle plugin in dev mode: `npx yarn dev`
- Bundle plugin in dev mode and start a watcher: `npx yarn watch`
- Upgrade dependencies: `npx yarn upgrade`

### Before submitting a pull request
- Run all tests: `npx yarn test`
- Run specific tests: `npx yarn test --testNamePattern "when some fields"`

## Release
1. Install packages: `npx yarn install`
2. Run prettier: `npx grafana-toolkit plugin:dev`
3. Update `CHANGELOG.md` and bump version within `package.json`
4. Build into `dist/`, lint and run tests: `npx yarn build`
5. Build plugin on CI: `npx grafana-toolkit plugin:ci-build`
6. Create a zip package: `npx grafana-toolkit plugin:ci-package`
   When this process succeeds, packages can be found within the `ci/packages/` folder.

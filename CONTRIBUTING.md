# Building the Grafana Map Panel

The easiest way to get started is to git clone the project repository 
directly into the `data/plugins` of your Grafana instance followed
by building it there.

1. Install npm packages: `npx yarn install`
2. Build and lint the JavaScript: `npx yarn build`
2. Run the tests before submitting a PR: `npx yarn test`
3. A test watcher when TDD:ing: `npx yarn dev --watch`

Grafana will read in the `dist` folder first so to see your changes in 
Grafana, you will have to build the plugin once. However, you do not 
need to restart your local Grafana server after every change, just 
refreshing the page will be sufficient.

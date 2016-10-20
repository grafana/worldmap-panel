# Building WorldMap

The easiest way to get started is to git clone the WorldMap project directly into the `data/plugins` folder in the Grafana source. (A git repo inside of a git repo)

1. Install npm packages: `npm install`
2. Run Grunt: `npm run build`
3. Before submitting a PR: `npm run lint`
4. A test watcher when TDD:ing: `npm run test`

Grafana will read in the dist folder first so to see your changes to WorldMap in Grafana, you have to run Grunt. However, you do not need to restart your local Grafana server after every change; just refresh the page.

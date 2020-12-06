# ===================
# Package and publish
# ===================

package:
	npx grafana-toolkit plugin:ci-build
	npx grafana-toolkit plugin:ci-build --finish
	npx grafana-toolkit plugin:ci-package

publish: check-tools check-token

	@# Before running this, export your GitHub access token.
	@#export GITHUB_TOKEN=8542f7c47b1697a79ab7f105e1d79f054d0b5599

	@# Read version from "package.json".
	$(eval version=$(shell cat package.json | jq --raw-output .version))

	@# Create release on GitHub.
	github-release release --user panodata --repo grafana-map-panel --tag $(version) || true

	@# Upload distribution package.
	$(eval distfile=ci/packages/grafana-map-panel-$(version).zip)
	github-release upload --user panodata --repo grafana-map-panel --tag $(version) --name $(notdir $(distfile)) --file $(distfile)


check-tools:
	@jq --version >/dev/null 2>&1 || (echo 'ERROR: "jq" not found. Please install using "brew install jq" or download from https://github.com/stedolan/jq/releases.' && exit 1)
	@github-release --version >/dev/null 2>&1 || (echo 'ERROR: "github-release" not found. Please install using "brew install github-release" or download from https://github.com/github-release/github-release/releases.' && exit 1)

check-token:
	@test -n "$(GITHUB_TOKEN)" || (echo 'ERROR: GITHUB_TOKEN environment variable not set.' && exit 1)

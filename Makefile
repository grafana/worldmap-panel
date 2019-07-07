# ============
# Main targets
# ============


# -------------
# Configuration
# -------------

$(eval venvpath     := .venv_util)
$(eval pip          := $(venvpath)/bin/pip)
$(eval python       := $(venvpath)/bin/python)
$(eval bumpversion  := $(venvpath)/bin/bumpversion)
$(eval github-release := ./bin/github-release)


# -----
# Build
# -----
sdist:
	yarn build


# -------
# Release
# -------

# Release this piece of software
# Synopsis:
#   make release bump=minor  (major,minor,patch)
release: bumpversion push sdist publish-release

prepare-release:

	@# Compute release name.
	$(eval name := grafana-worldmap-panel-ng)
	$(eval version := $(shell cat package.json | jq -r .version))
	$(eval releasename := $(name)-$(version))

	$(eval zipfile := artifacts/$(releasename).zip)

create-release: prepare-release

	@echo "Baking release artefacts for $(releasename)"

    # Create .zip archive.
	@mkdir -p artifacts
	(cd dist; zip -r ../$(zipfile) *)

publish-release: check-github-release prepare-release create-release

	@echo "Uploading release artefacts for $(releasename) to GitHub"

	@# Show current releases.
	@#$(github-release) info --user hiveeyes --repo grafana-worldmap-panel

    # Create Release.
	@#$(github-release) release --user hiveeyes --repo grafana-worldmap-panel --tag $(version) --draft
	$(github-release) release --user hiveeyes --repo grafana-worldmap-panel --tag $(version)

    # Upload release artifacts.
	$(github-release) upload --user hiveeyes --repo grafana-worldmap-panel --tag $(version) --name $(notdir $(zipfile)) --file $(zipfile) --replace



# ===============
# Utility targets
# ===============
bumpversion: install-releasetools
	@$(bumpversion) $(bump)

push:
	git push && git push --tags

install-releasetools: setup-virtualenv
	@$(pip) install --quiet 'bump2version==0.5.10' --upgrade

check-github-release:
	@test -e $(github-release) || (echo 'ERROR: "github-release" not found.\nPlease install "github-release" to "./bin/github-release".\nSee https://github.com/aktau/github-release\nand check "make install-github-release".'; exit 1)

install-github-release:

	# https://github.com/aktau/github-release
	$(eval url := https://github.com/aktau/github-release/releases/download/v0.7.2/darwin-amd64-github-release.tar.bz2)

	mkdir -p bin
	#@ cat ~/Downloads/darwin-amd64-github-release.tar.bz2
	curl $(url) | tar -xj --strip-components=3 -C bin/ bin/darwin/amd64/github-release

# Setup Python virtualenv
setup-virtualenv:
	@test -e $(python) || `command -v virtualenv` --python=python3 --no-site-packages $(venvpath)


# -------
# Project
# -------

grafana-start:
	# brew install grafana
	grafana-server --config=/usr/local/etc/grafana/grafana.ini --homepath /usr/local/share/grafana cfg:default.paths.logs=/usr/local/var/log/grafana cfg:default.paths.data=/usr/local/var/lib/grafana cfg:default.paths.plugins=/usr/local/var/lib/grafana/plugins

link-plugin:
	# This is also suitable for a Grafana installation on Homebrew
	ln -s `pwd` /usr/local/var/lib/grafana/plugins/grafana-worldmap-panel-ng

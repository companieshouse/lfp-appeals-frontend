artifact_name       := lfp-appeals-frontend
version             := "unversioned"

.PHONY: all
all: build

.PHONY: clean
clean:
	rm -f ./$(artifact_name)-*.zip
	rm -rf ./build
	rm -rf ./temp-*
	rm -f ./build.log

package-install:
	npm i

.PHONY: build
build:	package-install lint
	npm run build

.PHONY: lint
lint:
	npm run lint

.PHONY: sonar
sonar:
#	npm run sonarqube

.PHONY: test
test: test-unit

.PHONY: test-unit
test-unit:
	npm run test

.PHONY: package
package: build
ifndef version
	$(error No version given. Aborting)
endif
	$(info Packaging version: $(version))
	$(eval tmpdir := $(shell mktemp -d temp-XXXXXXXXXX))
	cp -r ./build/* $(tmpdir)
	cp -r ./package.json $(tmpdir)
	cp -r ./package-lock.json $(tmpdir)
	cp ./start.sh $(tmpdir)
	cp ./routes.yaml $(tmpdir)
	cd $(tmpdir) && npm i --production
	rm $(tmpdir)/package.json $(tmpdir)/package-lock.json
	cd $(tmpdir) && zip -r ../$(artifact_name)-$(version).zip .
	rm -rf $(tmpdir)


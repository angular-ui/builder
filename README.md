ui-mason
--------

Build server for angular-ui and ui-bootstrap.

Allows a remote user to download a custom build of angular-ui or ui-bootstrap.

#### API

* **List Modules**: GET `/ui-mason/:repo/`
  - `:repo` is `angular-ui` or `bootstrap`
  - Returns a list of available modules to build in the format `{modules: ['module1','module2']}`
* **Download Build**: GET `/ui-mason/:repo/download/`
  - Expects array of modules to download as query parameter `modules`
  - `:repo` is `angular-ui` or `bootstrap`
  - Will build if given module combination hasn't been built yet, then send zip file as download

#### Development

* Install npm dependencies for server: `npm install`
* Install submodules with `git submodule update --init`
* Install npm dependencies for submodules: `cd angular-ui && npm install; cd ../bootstrap && npm install`


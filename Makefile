GITDIR_BOOT = --git-dir=bootstrap/.git
GITDIR_UI = --git-dir=angular-ui/.git

# Run this when updating
update:
	rm -rf dist-*
	git ${GITDIR_BOOT} pull origin master --tags
	git ${GITDIR_BOOT} describe --tags --abbrev=0 | xargs git ${GITDIR_BOOT} checkout 
	git ${GITDIR_UI} pull origin master --tags
	git ${GITDIR_UI} describe --tags --abbrev=0 | xargs git ${GITDIR_UI} checkout 
	forever stop builder.js

start:
	forever start builder.js

.PHONY: update start

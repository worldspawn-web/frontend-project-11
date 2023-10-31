install:
	npm ci

linter:
	npx eslint

server:
	npx webpack serve

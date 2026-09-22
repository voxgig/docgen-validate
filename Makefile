VALIDATE := ./bin/validate-docgen
SUMMARIZE := ./bin/summarize
SPECS_DEFAULT := specs/default.txt
SPECS_SMOKE := specs/smoke.txt

.PHONY: help smoke full validate summarize comments comments-test deps deps-test hooks test

help:
	@echo "Targets:"
	@echo "  smoke               - validate the two smallest SDKs"
	@echo "  full                - validate the full five-SDK list"
	@echo "  validate            - alias for 'full'"
	@echo "  summarize RUN=<dir> - regenerate REPORT.md / report.json for a run"
	@echo "  test                - run this repo's own tests"
	@echo "  deps                - check every committed dependency source"
	@echo ""
	@echo "Pass extra flags via ARGS, e.g.:"
	@echo "  make smoke ARGS='--only univec'"
	@echo "  make full ARGS='--targets ts,go --vale'"
	@echo ""
	@echo "To validate an unreleased tool checkout instead of the published one:"
	@echo "  ARGS='--create-sdkgen-path ../create-sdkgen'"
	@echo "  ARGS='--docgen-path ../docgen/ts'"

smoke:
	$(VALIDATE) --specs $(SPECS_SMOKE) $(ARGS)

full:
	$(VALIDATE) --specs $(SPECS_DEFAULT) $(ARGS)

validate: full

summarize:
	@test -n "$(RUN)" || { echo "usage: make summarize RUN=<run-dir>"; exit 2; }
	$(SUMMARIZE) --run-dir $(RUN)

test: comments comments-test deps deps-test
	node --test test/*.test.cjs

comments:
	node tools/comment-gate.cjs

comments-test:
	node --test tools/comment-gate.test.cjs

deps:
	node tools/dep-gate.cjs

deps-test:
	node --test tools/dep-gate.test.cjs

hooks:
	git config core.hooksPath .githooks

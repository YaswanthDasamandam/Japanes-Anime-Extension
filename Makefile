# ==============================================================================
# Anime Rōmaji & Dual Subtitles - Development & Distribution Makefile
# ==============================================================================

.PHONY: all help version sync bump-patch bump-minor package test test-unit test-transcribe test-samples clean tag push

# Single Source of Truth: query version dynamically via scripts/sync-version.js
VERSION := $(shell node scripts/sync-version.js --get)
TAG     := $(shell node scripts/sync-version.js --get-tag)

# Default target: display help
all: help

help:
	@echo =======================================================================
	@echo   ANIME ROMAJI ^& DUAL SUBTITLES - MAKE COMMANDS
	@echo   Current Version (SSoT): $(VERSION) [Tag: $(TAG)]
	@echo =======================================================================
	@echo   make version         Display current project version
	@echo   make sync            Sync extension/manifest.json with package.json
	@echo   make bump-patch      Bump patch version (e.g. 0.1.0 -^> 0.1.1) and sync
	@echo   make bump-minor      Bump minor version (e.g. 0.1.0 -^> 0.2.0) and sync
	@echo   make package         Package extension into dist/ using current version
	@echo   make test            Run all unit and pipeline validation tests
	@echo   make test-transcribe Run Whisper STT audio transcription benchmark
	@echo   make clean           Remove dist/ bundles and temporary test output
	@echo   make tag             Create git tag $(TAG) using current SSoT version
	@echo   make push            Push main branch and tag $(TAG) to GitHub
	@echo =======================================================================

version:
	@node scripts/sync-version.js

sync:
	@node scripts/sync-version.js

bump-patch:
	@node scripts/sync-version.js --patch

bump-minor:
	@node scripts/sync-version.js --minor

package:
	@node scripts/package.js

test: test-unit

test-unit:
	@echo [1/4] Running Dictionary Test...
	@node tests/test_dictionary.js
	@echo.
	@echo [2/4] Running Dual Subtitles ^& Furigana Test...
	@node tests/test_dual_subtitles.js
	@echo.
	@echo [3/4] Running Lookahead ^& Pre-loading Cache Test...
	@node tests/test_lookahead_cache.js
	@echo.
	@echo [4/4] Running Pause Behavior Test...
	@node tests/test_pause_behavior.js

test-samples:
	@node tests/download_samples.js

test-transcribe:
	@node tests/run_transcription_test.js

clean:
	@node -e "import('fs').then(fs => { if (fs.existsSync('dist')) { fs.rmSync('dist', { recursive: true, force: true }); console.log('[Clean] dist/ removed.'); } else { console.log('[Clean] Nothing to clean.'); } })"

tag:
	@git tag -a $(TAG) -m "$(TAG): Release preview"
	@echo Tag $(TAG) created locally. Run 'make push' to publish to GitHub.

push:
	@git push origin main
	@git push origin $(TAG)
	@echo Pushed main and $(TAG) to GitHub successfully.

# ==============================================================================
# Anime Rōmaji & Dual Subtitles - Development & Distribution Makefile
# ==============================================================================

.PHONY: all help package test test-unit test-transcribe test-samples clean tag-test push-test

# Default target: display help
all: help

help:
	@echo =======================================================================
	@echo   ANIME ROMAJI ^& DUAL SUBTITLES - MAKE COMMANDS
	@echo =======================================================================
	@echo   make package         Package extension into dist/ zip files for testers
	@echo   make test            Run all unit and pipeline validation tests
	@echo   make test-unit       Run individual subtitle, dictionary, ^& pause tests
	@echo   make test-transcribe Run Whisper STT audio transcription benchmark
	@echo   make test-samples    Download test audio benchmark samples
	@echo   make clean           Remove dist/ bundles and temporary test output
	@echo   make tag-test        Create local git tag v0.1.0-test
	@echo   make push-test       Push commits and tag to GitHub
	@echo =======================================================================

# Package extension bundle for testers / pre-release
package:
	@node scripts/package.js

# Run all core unit and pipeline tests
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

# Download benchmark audio samples
test-samples:
	@node tests/download_samples.js

# Run Whisper AI transcription benchmark
test-transcribe:
	@node tests/run_transcription_test.js

# Clean build artifacts
clean:
	@node -e "import('fs').then(fs => { if (fs.existsSync('dist')) { fs.rmSync('dist', { recursive: true, force: true }); console.log('[Clean] dist/ removed.'); } else { console.log('[Clean] Nothing to clean.'); } })"

# Git helper to tag the current commit as a testing pre-release
tag-test:
	@git tag -a v0.1.0-test -m "v0.1.0-test: Experimental Testing Preview"
	@echo Tag v0.1.0-test created locally. Run 'make push-test' to publish to GitHub.

# Push main and the test tag to GitHub
push-test:
	@git push origin main
	@git push origin v0.1.0-test
	@echo Pushed main and v0.1.0-test tag to GitHub successfully.

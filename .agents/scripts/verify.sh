#!/usr/bin/env bash
# Build/test a Spring Boot project using whichever build tool it has.
# Usage: scripts/verify.sh [test|full] [project-dir]   (default: full, .)
set -euo pipefail

mode="${1:-full}"
dir="${2:-.}"
cd "$dir"

if [[ -f pom.xml ]]; then
  mvn_cmd=./mvnw; [[ -x ./mvnw ]] || mvn_cmd=mvn
  command -v "$mvn_cmd" >/dev/null || { echo "verify: no Maven wrapper or mvn on PATH" >&2; exit 2; }
  case "$mode" in
    test) exec "$mvn_cmd" -B -q test ;;
    full) exec "$mvn_cmd" -B verify ;;
  esac
elif [[ -f build.gradle || -f build.gradle.kts ]]; then
  gr_cmd=./gradlew; [[ -x ./gradlew ]] || gr_cmd=gradle
  command -v "$gr_cmd" >/dev/null || { echo "verify: no Gradle wrapper or gradle on PATH" >&2; exit 2; }
  case "$mode" in
    test) exec "$gr_cmd" --console=plain test ;;
    full) exec "$gr_cmd" --console=plain build ;;
  esac
else
  echo "verify: no pom.xml or build.gradle[.kts] in $(pwd)" >&2
  exit 2
fi
echo "verify: unknown mode '$mode' (use test|full)" >&2
exit 2

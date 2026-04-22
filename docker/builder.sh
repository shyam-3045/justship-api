#!/bin/bash

set -e

echo " Starting build..."

if [ -z "$REPO_URL" ]; then
  echo "REPO_URL not provided"
  exit 1
fi

if [ -z "$PROJECT_NAME" ]; then
  echo "PROJECT_NAME not provided"
  exit 1
fi

echo "📦 Project: $PROJECT_NAME"

if git ls-remote "$REPO_URL" > /dev/null 2>&1; then
  echo "Repo is accessible "
else
  echo "Repo not accessible (private / invalid repository)"
  exit 1
fi

git clone "$REPO_URL" repo
cd repo

if [ -n "$SUBFOLDER" ]; then
  echo " Using subfolder: $SUBFOLDER"
  cd "$SUBFOLDER"
fi

echo "Current directory: $(pwd)"

if [ -f "yarn.lock" ]; then
  PM="yarn"
elif [ -f "pnpm-lock.yaml" ]; then
  PM="pnpm"
else
  PM="npm"
fi

echo " Package Manager: $PM"

if [ "$PM" = "yarn" ]; then
  yarn install
elif [ "$PM" = "pnpm" ]; then
  npm install -g pnpm
  pnpm install
else
  if [ -f "package-lock.json" ]; then
    npm ci
  else
    npm install
  fi
fi

if [ -f "package.json" ]; then
  echo " Building project..."
  if [ "$PM" = "yarn" ]; then
    yarn build
  elif [ "$PM" = "pnpm" ]; then
    pnpm build
  else
    npm run build
  fi
else
  echo " No package.json → skipping build"
fi

OUTPUT=""

if [ -d "dist" ]; then
  if [ -f "dist/index.html" ]; then
    OUTPUT="dist"
  else
    OUTPUT=$(find dist -mindepth 1 -maxdepth 1 -type d | head -n 1)
  fi
elif [ -d "build" ]; then
  OUTPUT="build"
elif [ -f "index.html" ]; then
  OUTPUT="."
else
  echo " No valid build output found"
  exit 1
fi

echo " Output directory: $OUTPUT"

mkdir -p "/output/$PROJECT_NAME"
cp -r "$OUTPUT"/* "/output/$PROJECT_NAME"

echo " Build completed successfully"
echo "BUILD_SUCCESS:$PROJECT_NAME"
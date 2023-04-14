# Changelog

All notable changes to the "Token Distinguisher" module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Initial release of the module.

## [1.0.0] - 2023-04-13

### Added

- Automatically distinguishes tokens with the same name by appending a unique ordinal number.
- Handles name collisions for both newly created tokens and tokens already present in the scene.
- Retains the original name of each token in a flag for easy reference or reverting.
- Includes hooks for `canvasReady` and `createToken` events.
- Provides a README and a CHANGELOG file for documentation.

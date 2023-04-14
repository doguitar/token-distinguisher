# Token Distinguisher

Token Distinguisher is a Foundry VTT module that helps Game Masters handle token name collisions by automatically distinguishing tokens with the same name. It groups tokens with the same original name and assigns a unique name to each token in the group based on their original name and ordinal number.

## Features

- Automatically distinguishes tokens with the same name by appending a unique ordinal number.
- Handles name collisions for both newly created tokens and tokens already present in the scene.
- Retains the original name of each token in a flag for easy reference or reverting.

## Installation

1. In Foundry VTT, navigate to the "Add-on Modules" tab in the Configuration and Setup window.
2. Click the "Install Module" button and enter the following Manifest URL: `https://raw.githubusercontent.com/doguitar/token-distinguisher/master/module.json`
3. Click "Install" to install the module.
4. After installation, enable the module by checking the box next to "Token Distinguisher" in the "Add-on Modules" tab.

## Usage

Once the module is enabled, it will automatically handle token name collisions for tokens in your game.

- When a new token is created, the module will check for existing tokens with the same name and update the new token's name to be unique by appending a unique ordinal number.
- When the canvas is ready, the module will process existing tokens in the scene and update their names if there are any name collisions.

There's no need for additional configuration or user intervention; the module works automatically to handle token name collisions.

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/doguitar/token-distinguisher/issues) on the GitHub repository.

## License

This Foundry VTT module, Token Distinguisher, is licensed under the [MIT License](LICENSE).

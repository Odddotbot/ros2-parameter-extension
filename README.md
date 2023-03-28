# OddBot ROS2 Parameters Extension

## Intro

The **ROS2 Parameters Extension** provides functionality to:

- **View** a node's parameter names, types, and values in a table format.
- **Set** new parameter values for all types of parameters on a node.
- **Load** a previous configuration from a .yml file stored on your computer.

Currently only works with a `rosbridge` connection.

## Installation

- Install [Node.js](https://nodejs.org/en/):
  - Make sure to enable `npm package manager`.
- Install `Yarn`:
  - Open command line interface.
  - Run `npm install -g yarn`.
- Install `ROS2 parameters extension`:
  - Open command line interface.
  - Go to `ros2-parameter-extension` repo folder.
  - Run `yarn local-install`.
  - In folder `~/.foxglove-studio/extensions` should appear a folder `oddbot.oddbot-ros2-parameter-extension-#.#.#`.
    - Note that Foxglove has trouble handling multiple versions of the same extension.
    - Make sure folder `~/.foxglove-studio/extensions` contains ony one folder `oddbot.oddbot-ros2-parameter-extension-#.#.#` and not multiple versions.
- Add `ROS2 parameters extension` panel:
  - Open `Foxglove Studio`.
  - In the left sidebar click button `Extensions`.
  - In the list under `Local` should appear an extension `ROS2 Parameters #.#.#`.
  - In the left sidebar click button `Add Panel`.
  - In the list should appear a panel `OddBot ROS2 Parameters [local]`.
  - Click to add this panel.

## Show Foxglove console and logs

- In the left sidebar click button `Preferences`
- Under `Experimental features` enable `Studio debug panels`.
- Press `Alt` to show a top menu containing tabs `File` `Edit` `View` `Help`.
- Click `View > Advanced > Toggle Developer Tools`.
- In the `Developer Tools` view select tab `Console`. 

## References

- <https://foxglove.dev/docs/studio/extensions/getting-started>
- <https://foxglove.dev/docs/studio/extensions/guide-create-custom-panel>
- <https://foxglove.dev/docs/studio/extensions/local-development>

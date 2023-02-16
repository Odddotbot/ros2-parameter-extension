import {ExtensionContext} from "@foxglove/studio";
import {initParameterPanel} from "./ParameterPanel";

export function activate(extensionContext: ExtensionContext) {
    extensionContext.registerPanel({name: "OddBot ROS2 Parameters", initPanel: initParameterPanel});
}

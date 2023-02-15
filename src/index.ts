import { ExtensionContext } from "@foxglove/studio";
import { initParamsPanel } from "./ExamplePanel";

export function activate(extensionContext: ExtensionContext) {
  extensionContext.registerPanel({ name: "OddBot ROS2 Parameters", initPanel: initParamsPanel });
}



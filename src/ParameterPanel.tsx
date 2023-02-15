import {PanelExtensionContext, RenderState} from "@foxglove/studio";
import {useEffect, useLayoutEffect, useState} from "react";
import ReactDOM from "react-dom";
import type {Parameter, ParameterValue, SetSrvParameter} from "parameter_types";


let node: string;
let parameterNames: string[];
let parameterTypes: string[] = ["boolean", "integer", "double", "string", "byte_array", "boolean_array", "integer_array", "double_array", "string_array"];
let parameterValues: ParameterValue[];


export function initParameterPanel(context: PanelExtensionContext) {
    ReactDOM.render(<ParameterPanel context={context}/>, context.panelElement);
}


function ParameterPanel({context}: { context: PanelExtensionContext }): JSX.Element {

    const [renderDone, setRenderDone] = useState<(() => void) | undefined>();
    const [status, setStatus] = useState<string | undefined>();

    const [nodes, setNodes] = useState<string[]>();
    const [parameters, setParameters] = useState<Array<Parameter>>();
    const [srvParameters, setSrvParameters] = useState<Array<SetSrvParameter>>();

    const [colorScheme, setColorScheme] = useState<string>();
    const [bgColor, setBgColor] = useState("#d6d6d6");
    const [loadButtonBgColor, setLoadButtonBgColor] = useState("#d6d6d6");


    useLayoutEffect(() => {
        context.onRender = (renderState: RenderState, done) => {
            setRenderDone(() => done);
            fetchNodes();
            //Manage some styling for light and dark theme
            setColorScheme(renderState.colorScheme);
            if (renderState.colorScheme == "light") {
                setBgColor("#d6d6d6");
                setLoadButtonBgColor("#d6d6d6");
            } else if (renderState.colorScheme == "dark") {
                setBgColor("#4d4d4d");
                setLoadButtonBgColor("#4d4d4d");
            }
        };

        //If new topics are found, context.onRender() will update the list of nodes
        context.watch("topics");

        //If colorScheme changes, context.onRender() will change styling to match new color scheme
        context.watch("colorScheme");

    }, []);

    // invoke the done callback once the render is complete
    useEffect(() => {
        renderDone?.();
    }, [renderDone]);


    /**
     * Split string into string array
     * @param str string
     * @returns String array
     */
    const stringToArray = (str: string) => {
        return str
            .replaceAll(" ", "")
            .replace("[", "")
            .replace("]", "")
            .split(",");
    };


    /**
     * return the parameter type of the given parameter value
     * @param parameterValue The given Parameter Value
     * @returns parameterValue's parameter type
     */
    const getParameterType = (parameterValue: ParameterValue) => {
        if (parameterValue === undefined)
            return "undefined";
        return parameterTypes[parameterValue.type - 1];
    };


    /**
     * Returns the string value of a paramter's value to be outputted on the screen
     * @param parameterValue The parameter value that is converted to a string
     * @returns String representation of parameterValue
     */
    const getParameterValue = (parameterValue: ParameterValue) => {
        if (parameterValue === undefined)
            return "undefined";

        switch (parameterValue.type) {
            case 1:
                return parameterValue.bool_value.toString();
            case 2:
                return parameterValue.integer_value.toString();
            case 3:
                return parameterValue.double_value.toString();
            case 4:
                return parameterValue.string_value;
            case 5:
                return `[${parameterValue.byte_array_value.toString()}]`;
            case 6:
                return `[${parameterValue.bool_array_value.toString()}]`;
            case 7:
                return `[${parameterValue.integer_array_value.toString()}]`;
            case 8:
                return `[${parameterValue.double_array_value.toString()}]`;
            case 9:
                return `[${parameterValue.string_array_value.toString()}]`;
            default:
                return "error, invalid type...";
        }
    };


    /**
     * Updates the list of nodes when a new node appears
     */
    const fetchNodes = () => {
        setStatus("Fetching nodes...");
        context.callService?.("/rosapi/nodes", {})
            .then((_value: unknown) => {
                setNodes((_value as any).nodes as string[]);
                setStatus("Fetching nodes done");
            })
            .catch((_error: Error) => {
                setNodes([]);
                setStatus("Fetching nodes failed: " + _error.message);
            });
    };


    /**
     * Retrieves a list of all parameters for the current node and their values
     */
    const fetchNodeParameters = () => {
        setStatus("Fetching node parameters for node " + node + "...");
        context.callService?.(node + "/list_parameters", {})
            .then((_value: unknown) => {
                parameterNames = (_value as any).result.names as string[];

                context.callService?.(node + "/get_parameters", {names: parameterNames})
                    .then((_value: unknown) => {
                        parameterValues = (_value as any).values as ParameterValue[];

                        let tempParameters: Array<Parameter> = [];
                        for (let i = 0; i < parameterNames.length; i++) {
                            let parameter = {
                                name: parameterNames[i]!,
                                value: parameterValues[i]!
                            };
                            tempParameters.push(parameter);
                        }
                        setParameters(tempParameters);
                        setSrvParameters(new Array(tempParameters.length));
                        setStatus("Fetching node parameters done");
                    })
                    .catch((_error) => {
                        setStatus("Fetching node parameters values failed: " + _error.message);
                    });
            })
            .catch((_error) => {
                setStatus("Fetching node parameters failed: " + _error.message);
            });
    };


    /**
     * Sets new values to all parameters with an inputted new value
     * Calls fetchNodeParameters() to 'refresh' the screen and display the new parameter values
     */
    const sendNodeParameters = () => {
        let tempSrvParameters: SetSrvParameter[] = srvParameters!;
        for (let i: number = 0; i < tempSrvParameters.length; i++) {
            if (tempSrvParameters[i] == null) {
                tempSrvParameters.splice(i, 1);
                i = -1;
            }
        }
        setSrvParameters(tempSrvParameters);

        setStatus("Sending node parameters for node " + node + "...");
        context.callService?.(node + "/set_parameters", {parameters: srvParameters})
            .then(() => {
                setStatus("Sending node parameters done");
            })
            .catch((_error) => {
                setStatus("Sending node parameters failed: " + _error.message);
            })
            .finally(() => {
                fetchNodeParameters();
            });
    };


    /**
     * Update the list of Parameters with new values to be set
     * @param parameterValue The new value to be set
     * @param parameterName The name of the parameter that will be set to 'parameterValue'
     */
    const setSrvParameterValue = (parameterName: string, parameterValue: string) => {
        let idx: number = parameterNames?.indexOf(parameterName)!;
        let tempSrvParameters: SetSrvParameter[] = srvParameters!;

        if (parameterValue === "")
            tempSrvParameters[idx] = {};
        else {
            switch (parameters![idx]?.value.type!) {
                case 1:
                    tempSrvParameters[idx] = {
                        name: parameterName,
                        value: {
                            type: 1,
                            bool_value: parameterValue.trim().toLowerCase() === "true"
                        }
                    };
                    break;

                case 2:
                    tempSrvParameters[idx] = {
                        name: parameterName,
                        value: {
                            type: 2,
                            integer_value: +parameterValue
                        }
                    };
                    break;

                case 3:
                    tempSrvParameters[idx] = {
                        name: parameterName,
                        value: {
                            type: 3,
                            double_value: +parameterValue
                        }
                    };
                    break;

                case 4:
                    tempSrvParameters[idx] = {
                        name: parameterName,
                        value: {
                            type: 4,
                            string_value: parameterValue
                        }
                    };
                    break;

                case 5:  // TODO: Implement format for byte arrays
                    tempSrvParameters[idx] = {
                        name: parameterName,
                        value: {
                            type: 5,
                            byte_array_value: parameterValue as unknown as number[]
                        }
                    };
                    break;

                case 6:
                    tempSrvParameters[idx] = {
                        name: parameterName,
                        value: {
                            type: 6,
                            bool_array_value: stringToArray(parameterValue).map(Boolean)
                        }
                    };
                    break;

                case 7:
                    tempSrvParameters[idx] = {
                        name: parameterName,
                        value: {
                            type: 7,
                            integer_array_value: stringToArray(parameterValue).map(Number)
                        }
                    };
                    break;

                case 8:
                    tempSrvParameters[idx] = {
                        name: parameterName,
                        value: {
                            type: 8,
                            double_array_value: stringToArray(parameterValue).map(Number)
                        }
                    };
                    break;

                case 9:
                    tempSrvParameters[idx] = {
                        name: parameterName,
                        value: {
                            type: 9,
                            string_array_value: stringToArray(parameterValue)
                        }
                    };
                    break;

                default:
                    tempSrvParameters[idx] = {};
                    break;
            }
            setSrvParameters(tempSrvParameters)
        }
    };


    /**
     * Creates a dropdown input box if parameter is a boolean, creates a text input box otherwise
     * @param parameter The parameter that an input box is being created for
     * @returns A dropdown if parameter.value.type == 1, a textbox otherwise
     */
    const createInputBox = (parameter: Parameter) => {
        if (parameter.value.type == 1) {
            return (
                <select
                    style={dropDownStyle}
                    onChange={(event) => {
                        setSrvParameterValue(parameter.name, event.target.value)
                    }}
                >
                    <option selected hidden></option>
                    <option>true</option>
                    <option>false</option>
                </select>
            );
        }
        return (
            <input style={inputStyle} placeholder={getParameterValue(parameter.value)} onChange={(event) => {
                setSrvParameterValue(parameter.name, event.target.value)
            }}/>
        );
    };


    /**
     * loads parameter values from a YAML file and sets all new values
     * @param files the YAML file to be uploaded
     */
    const loadParameterFile = (files: FileList | null) => {
        if (files !== null) {
            files[0]?.text()
                .then((value: string) => {
                    value = value.replaceAll(/[^\S\r\n]/gi, "");
                    value = value.replace(node + ":\n", "");
                    value = value.replace("ros__parameters:\n", "");

                    let parameterNameArray: string[] = value.split("\n");
                    for (let i = 0; i < parameterNameArray.length; i++) {

                        if (parameterNameArray[i]!.charAt(0) != '-' && parameterNameArray[i]!.charAt(parameterNameArray[i]!.length - 1) != ':') {
                            let temp: string[] = parameterNameArray[i]!.split(":");
                            setSrvParameterValue(temp[0]!, temp[1]!);

                        } else if (parameterNameArray[i]!.charAt(parameterNameArray[i]!.length - 1) == ':') {
                            let tempParameterName: string = parameterNameArray[i]!.replace(":", "").trim();
                            let tempParameterValue: string = "";

                            while (i + 1 < parameterNameArray.length && parameterNameArray[++i]!.charAt(0) == '-') {
                                tempParameterValue = tempParameterValue.concat(parameterNameArray[i]!.replace("-", "").trim() + ",");
                            }

                            i--;
                            tempParameterValue = tempParameterValue.substring(0, tempParameterValue.length - 1);
                            setSrvParameterValue(tempParameterName, tempParameterValue);
                        }
                    }
                    sendNodeParameters();
                })
                .catch((error: Error) => {
                    console.log(error)
                });
        }
    };


    ///////////////////////////////////////////////////////////////////
    //////////////////////// PANEL LAYOUT /////////////////////////////
    ///////////////////////////////////////////////////////////////////

    //////////////////////// CSS STYLING //////////////////////////////

    let setButtonStyle = {};
    let loadButtonStyle = {};
    let dropDownStyle = {};
    let inputStyle = {};

    if (colorScheme == "light") {

        setButtonStyle = {

            fontSize: "1rem",
            backgroundColor: bgColor,
            border: bgColor + " solid",
            margin: "36px 12px 36px 0px",
            padding: "8px",
            borderRadius: "4px",
            color: "#333333",
            fontWeight: "500",

        };

        loadButtonStyle = {

            fontSize: "1rem",
            backgroundColor: loadButtonBgColor,
            border: loadButtonBgColor + " solid",
            margin: "36px 0px 36px 12px",
            padding: "8px",
            borderRadius: "4px",
            color: "#333333",
            fontWeight: "500",

        };

        dropDownStyle = {

            fontSize: "1rem",
            padding: "3px",
            flex: 1,
            backgroundColor: "#f7f7f7",
            color: "#333333",
            borderRadius: "3px",

        };

        inputStyle = {

            fontSize: "1rem",
            padding: "3px",
            backgroundColor: "#f7f7f7",
            border: "1px solid #333333",
            borderRadius: "3px",
            marginBottom: "2px",

        };

    } else if (colorScheme == "dark") {

        setButtonStyle = {

            fontSize: "1rem",
            backgroundColor: bgColor,
            border: bgColor + " solid",
            margin: "36px 12px 36px 0px",
            padding: "8px",
            borderRadius: "4px",
            color: "#f7f7f7",
            fontWeight: "500",

        };

        loadButtonStyle = {

            fontSize: "1rem",
            backgroundColor: loadButtonBgColor,
            border: loadButtonBgColor + " solid",
            margin: "36px 0px 36px 12px",
            padding: "8px",
            borderRadius: "4px",
            color: "#f7f7f7",
            fontWeight: "500",

        };

        dropDownStyle = {

            fontSize: "1rem",
            padding: "3px",
            flex: 1,
            backgroundColor: "#4d4d4d",
            color: "#f7f7f7",
            borderRadius: "3px",

        };

        inputStyle = {

            fontSize: "1rem",
            padding: "3px",
            backgroundColor: "#4d4d4d",
            color: "#f7f7f7",
            border: "1px solid #4d4d4d",
            borderRadius: "3px",
            marginBottom: "2px",

        };

    }

    const labelStyle = {
        fontSize: "1.35rem",
        paddingRight: "12px",
        marginBottom: "10px",
        fontWeight: "500",
    };

    const statusStyle = {
        fontSize: "0.8rem",
        padding: "5px",
        borderTop: "0.5px solid",
    };

    const footerStyle = {
        backgroundColor: "#F8F8F8",
        borderTop: "1px solid #E7E7E7",
        textAlign: "center",
        padding: "20px",
        position: "fixed",
        left: "0",
        bottom: "0",
        height: "60px",
        width: "100%"
    };
    footerStyle;

    ///////////////////////// HTML PANEL //////////////////////////////

    return (
        <body>
        <div style={{
            padding: "1rem",
            scrollBehavior: "smooth",
            maxHeight: "calc(100% - 25px)",
            overflowY: "scroll",
            fontFamily: "helvetica",
            fontSize: "1rem",
        }}>
            <label style={labelStyle}>Node:</label>
            <select
                value={node}
                onChange={(event) => {
                    node = event.target.value;
                    fetchNodeParameters();
                }}
                style={dropDownStyle}
            >
                <option selected hidden>Select a Node</option>
                {(nodes ?? []).map((node) => (
                    <option key={node} value={node}>{node}</option>
                ))}
            </select>

            <form>
                <button
                    style={setButtonStyle}
                    onMouseEnter={() => setBgColor("#8f8f8f")}
                    onMouseLeave={() => colorScheme == "dark" ? setBgColor("#4d4d4d") : setBgColor("#d6d6d6")}
                    onClick={sendNodeParameters}
                    type="reset">
                    Set Parameters
                </button>

                <label
                    style={loadButtonStyle}
                    onMouseEnter={() => setLoadButtonBgColor("#8f8f8f")}
                    onMouseLeave={() => colorScheme == "dark" ? setLoadButtonBgColor("#4d4d4d") : setLoadButtonBgColor("#d6d6d6")}
                >
                    <input type="file" style={{display: "none"}} onChange={(event) => {
                        loadParameterFile(event.target.files)
                    }}/>
                    Load
                </label>
                <br/>

                <label style={labelStyle}>Save to YAML</label>
                <br/>

                <label style={labelStyle}>Parameter List</label>
                <br/>
                <div style={{display: "grid", gridTemplateColumns: "1fr 0.75fr 1fr 0.75fr", rowGap: "0.2rem",}}>
                    <b style={{borderBottom: "1px solid", padding: "2px", marginBottom: "3px",}}>Parameter</b>
                    <b style={{borderBottom: "1px solid", padding: "2px", marginBottom: "3px"}}>Type</b>
                    <b style={{borderBottom: "1px solid", padding: "2px", marginBottom: "3px"}}>Value</b>
                    <b style={{borderBottom: "1px solid", padding: "2px", marginBottom: "3px"}}>New Value</b>

                    {(parameters ?? []).map((result) => (
                        <>
                            <div style={{margin: "0px 4px 0px 4px"}} key={result.name}>{result.name}:</div>
                            <div style={{margin: "0px 4px 0px 4px"}}>{getParameterType(result.value)}</div>
                            <div style={{margin: "0px 4px 0px 4px"}}>{getParameterValue(result.value)}</div>
                            <div style={{margin: "0px 4px 0px 4px"}}>
                                {createInputBox(result)}
                            </div>
                        </>
                    ))}
                </div>
            </form>
        </div>
        <div style={{left: "0px", bottom: "0px", height: "25px", width: "100%", position: "sticky"}}>
            <p style={statusStyle}>status: {status}</p>
        </div>
        </body>
    );

    ///////////////////////////////////////////////////////////////////
}

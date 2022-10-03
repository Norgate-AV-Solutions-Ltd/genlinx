export const cfg = {
    type: "object",
    properties: {
        outputFileSuffix: {
            type: "string",
            pattern: "^[a-zA-Z0-9_\\-\\.]+.cfg$",
        },
        outputLogFileSuffix: {
            type: "string",
            pattern: "^[a-zA-Z0-9_\\-\\.]+.log$",
        },
        outputLogFileOption: {
            enum: ["A", "N"],
        },
        outputLogConsoleOption: {
            type: "boolean",
        },
        buildWithDebugInformation: {
            type: "boolean",
        },
        buildWithSource: {
            type: "boolean",
        },
        includePath: {
            type: "array",
            uniqueItems: true,
        },
        modulePath: {
            type: "array",
            uniqueItems: true,
        },
        libraryPath: {
            type: "array",
            uniqueItems: true,
        },
        all: {
            type: "boolean",
        },
    },
    additionalProperties: false,
};

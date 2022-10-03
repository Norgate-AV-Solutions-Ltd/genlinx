export const archive = {
    type: "object",
    properties: {
        outputFileSuffix: {
            type: "string",
            pattern: "^[a-zA-Z0-9_\\-\\.]+.zip$",
        },
        includeCompiledSourceFiles: {
            type: "boolean",
        },
        includeCompiledModuleFiles: {
            type: "boolean",
        },
        includeFilesNotInWorkspace: {
            type: "boolean",
        },
        extraFileSearchLocations: {
            type: "array",
            uniqueItems: true,
        },
        extraFileArchiveLocation: {
            type: "string",
        },
        all: {
            type: "boolean",
        },
        ignoredFiles: {
            type: "array",
            uniqueItems: true,
        },
    },
    additionalProperties: false,
};

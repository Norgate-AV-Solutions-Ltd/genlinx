import fs from "fs-extra";
import chalk from "chalk";
import { APW, CfgBuilder } from "../../../lib";
import {
    getFilesByExtension,
    getGlobalAppConfig,
    getLocalAppConfig,
    getOptions,
    loadAPW,
    printFiles,
    selectFiles,
} from "../../../lib/utils";

function shouldPromptUser(options, files) {
    return !options.all && files.length > 1;
}

export const cfg = {
    async create(cliOptions) {
        try {
            const { workspaceFiles } = cliOptions;

            if (workspaceFiles.length === 0) {
                console.log(chalk.blue("Searching for workspace files..."));

                const locatedWorkspaceFiles = await getFilesByExtension(
                    APW.fileExtensions[APW.fileType.workspace],
                );

                if (locatedWorkspaceFiles.length) {
                    printFiles(locatedWorkspaceFiles);
                    workspaceFiles.push(...locatedWorkspaceFiles);
                }
            }

            if (workspaceFiles.length === 0) {
                console.log(chalk.red("No workspace files found."));
                process.exit();
            }

            if (shouldPromptUser(cliOptions, workspaceFiles)) {
                const selectedWorkspaceFiles = await selectFiles(
                    workspaceFiles,
                );

                workspaceFiles.splice(0, workspaceFiles.length);
                workspaceFiles.push(...selectedWorkspaceFiles);
            }

            const globalConfig = await getGlobalAppConfig();

            for (const workspaceFile of workspaceFiles) {
                const apw = await loadAPW(workspaceFile);

                const localConfig = await getLocalAppConfig(workspaceFile);

                const { cfg: options } = getOptions(
                    { cfg: cliOptions },
                    localConfig.store,
                    globalConfig.store,
                );

                console.log(
                    chalk.blue(`Generating CFG for ${workspaceFile}...`),
                );

                const cfgBuilder = new CfgBuilder(apw, options);
                const cfg = cfgBuilder.build();

                const outputFile = `${apw.id}.${options.outputFileSuffix}`;
                fs.writeFile(outputFile, cfg);
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    },
};

export default cfg;

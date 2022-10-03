import execa from "execa";
import chalk from "chalk";
import { NLRC } from "../../../lib";
import {
    getFilesByExtension,
    getGlobalAppConfig,
    getLocalAppConfig,
    getOptions,
    printFiles,
    selectFiles,
} from "../../../lib/utils";

function getBuildLogs(data) {
    const pattern = /(?<log>(?<level>ERROR|WARNING): .+)/gm;
    const matches = data.matchAll(pattern);

    const logs = {
        error: [],
        warning: [],
    };

    for (const match of matches) {
        const { log, level } = match.groups;
        logs[level.toLowerCase()].push(log);
    }

    return logs;
}

function catchAllErrors(errors) {
    if (errors.length === 0) {
        return;
    }

    console.log(chalk.red(`A total of ${errors.length} error(s) occurred.`));

    for (const error of errors) {
        console.log(chalk.red(error));
    }

    throw new Error(
        `The build process failed with a total of ${errors.length} error(s).`,
    );
}

function printAllWarnings(warnings) {
    if (warnings.length === 0) {
        return;
    }

    console.log(
        chalk.yellow(`A total of ${warnings.length} warning(s) occurred.`),
    );

    for (const warning of warnings) {
        console.log(chalk.yellow(warning));
    }
}

function shouldPromptUser(options, files) {
    return !options.all && files.length > 1;
}

async function runBuildProcess(command, options) {
    const { shell } = options;

    const childProcess = execa(command.path, [...command.args], {
        shell: shell.path,
        windowsVerbatimArguments: true,
        reject: false,
    });

    childProcess.stdout.pipe(process.stdout);

    const { stdout } = await childProcess;
    return stdout;
}

async function buildFile(file, command, options) {
    console.log(chalk.blue(`Executing build for ${file}...`));

    const buildResult = await runBuildProcess(command, options);

    return buildResult;
}

export const build = {
    async execute(cliOptions) {
        try {
            const { cfgFiles, sourceFile } = cliOptions;

            const globalConfig = await getGlobalAppConfig();

            if (sourceFile) {
                const localConfig = await getLocalAppConfig(sourceFile);
                const options = getOptions(
                    cliOptions,
                    localConfig.build,
                    globalConfig.build,
                );

                const command = NLRC.getSourceBuildCommand(sourceFile, options);

                const buildResult = await buildFile(
                    sourceFile,
                    command,
                    options,
                );

                const logs = getBuildLogs(buildResult);

                printAllWarnings(logs.warning);
                catchAllErrors(logs.error);

                process.exit();
            }

            if (cfgFiles.length === 0) {
                console.log(chalk.blue("Searching for CFG files..."));

                const locatedCfgFiles = await getFilesByExtension(".cfg");

                if (locatedCfgFiles.length) {
                    printFiles(locatedCfgFiles);
                    cfgFiles.push(...locatedCfgFiles);
                }
            }

            if (cfgFiles.length === 0) {
                console.log(chalk.red("No CFG files found."));
                process.exit();
            }

            if (shouldPromptUser(cliOptions, cfgFiles)) {
                const selectedCfgFiles = await selectFiles(cfgFiles);

                cfgFiles.splice(0, cfgFiles.length);
                cfgFiles.push(...selectedCfgFiles);
            }

            for (const cfgFile of cfgFiles) {
                const localConfig = await getLocalAppConfig(cfgFile);

                const { build: options } = getOptions(
                    { build: cliOptions },
                    localConfig.store,
                    globalConfig.store,
                );

                const command = NLRC.getCfgBuildCommand(cfgFile, options);

                const buildResult = await buildFile(cfgFile, command, options);

                const logs = getBuildLogs(buildResult);

                printAllWarnings(logs.warning);
                catchAllErrors(logs.error);
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    },
};

export default build;

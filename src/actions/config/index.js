import execa from "execa";
import { getGlobalAppConfig, getLocalAppConfig } from "../../../lib/utils";

async function openInEditor(config) {
    const editor = config.get("core.editor") || process.env.EDITOR || "code";

    const childProcess = execa(editor, [config.path], {
        stdio: "inherit",
    });

    await childProcess;
}

export const config = {
    async set(key, value, cliOptions) {
        try {
            const { global, local } = cliOptions;

            if (global) {
                const globalConfig = getGlobalAppConfig();
                globalConfig.set(key, value);
            }

            if (local) {
                const localConfig = await getLocalAppConfig();
                localConfig.set(key, value);
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    },
    async get(key, cliOptions) {
        try {
            const { global, local } = cliOptions;

            if (global) {
                const globalConfig = getGlobalAppConfig();
                console.log(globalConfig.get(key));
            }

            if (local) {
                const localConfig = await getLocalAppConfig();
                console.log(localConfig.get(key));
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    },
    async show(cliOptions) {
        try {
            const { global, local } = cliOptions;

            if (global) {
                const globalConfig = getGlobalAppConfig();
                console.log(JSON.stringify(globalConfig.store, null, 4));
            }

            if (local) {
                const localConfig = await getLocalAppConfig();
                console.log(JSON.stringify(localConfig.store, null, 4));
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    },
    async edit(cliOptions) {
        try {
            const { global, local } = cliOptions;

            if (global) {
                const globalConfig = getGlobalAppConfig();
                await openInEditor(globalConfig);
            }

            if (local) {
                const localConfig = await getLocalAppConfig();
                await openInEditor(localConfig);
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    },
};

export default config;

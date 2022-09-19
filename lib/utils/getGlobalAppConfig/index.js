import path from "path";
import Conf from "conf";
import { defaultGlobalAppConfig } from "../../../config";
import { schema } from "../../../config/schema";
import pkg from "../../../package.json";

export async function getGlobalAppConfig() {
    const globalConfig = new Conf({
        defaults: defaultGlobalAppConfig,
        schema,
        projectName: path.basename(pkg.name),
        projectSuffix: "",
    });

    return globalConfig.store;
}

export default getGlobalAppConfig;

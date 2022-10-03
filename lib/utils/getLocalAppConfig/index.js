import path from "path";
import Conf from "conf";
import findUp from "find-up";
import { schema } from "../../../config/schema";

export async function getLocalAppConfig(filePath) {
    const configFilePath = await findUp(".genlinxrc.json", {
        cwd: path.dirname(filePath),
    });

    if (!configFilePath) {
        return {};
    }

    const localConfig = new Conf({
        schema,
        configName: path.basename(configFilePath, ".json"),
        cwd: path.dirname(configFilePath),
    });

    return localConfig;
}

export default getLocalAppConfig;

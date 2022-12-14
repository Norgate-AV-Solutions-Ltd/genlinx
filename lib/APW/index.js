import fs from "fs-extra";
import path from "path";

export class APW {
    static fileType = {
        workspace: "Workspace",
        module: "Module",
        masterSrc: "MasterSrc",
        source: "Source",
        include: "Include",
        ir: "IR",
        tp4: "TP4",
        tp5: "TP5",
        tpd: "TPD",
        kpd: "KPD",
        axb: "AXB",
        tko: "TKO",
        irDb: "IRDB",
        irnDb: "IRNDB",
        duet: "Duet",
        tok: "TOK",
        tkn: "TKN",
        kpb: "KPB",
        xdd: "XDD",
        other: "Other",
    };

    static fileExtensions = {
        [APW.fileType.workspace]: ".apw",
        [APW.fileType.module]: ".axs",
        [APW.fileType.masterSrc]: ".axs",
        [APW.fileType.source]: ".axs",
        [APW.fileType.include]: ".axi",
        [APW.fileType.ir]: ".irl",
        [APW.fileType.tp4]: ".tp4",
        [APW.fileType.tp5]: ".tp5",
        [APW.fileType.tpd]: ".tpd",
        [APW.fileType.duet]: ".jar",
        [APW.fileType.xdd]: ".xdd",
    };

    static compiledFileExtensions = {
        [APW.fileType.module]: ".tko",
        [APW.fileType.masterSrc]: ".tkn",
        [APW.fileType.source]: ".tkn",
    };

    static fileTypeFromExtension = {
        [APW.fileExtensions[APW.fileType.module]]: APW.fileType.module,
        [APW.fileExtensions[APW.fileType.include]]: APW.fileType.include,
        [APW.fileExtensions[APW.fileType.duet]]: APW.fileType.duet,
        [APW.fileExtensions[APW.fileType.xdd]]: APW.fileType.xdd,
        [APW.fileExtensions[APW.fileType.workspace]]: APW.fileType.workspace,
        [APW.fileExtensions[APW.fileType.ir]]: APW.fileType.ir,
        [APW.fileExtensions[APW.fileType.tp4]]: APW.fileType.tp4,
        [APW.fileExtensions[APW.fileType.tp5]]: APW.fileType.tp5,
        [APW.fileExtensions[APW.fileType.tpd]]: APW.fileType.tpd,
        [APW.compiledFileExtensions[APW.fileType.module]]: APW.fileType.module,
        [APW.compiledFileExtensions[APW.fileType.source]]: APW.fileType.source,
    };

    #filePath;

    #id;

    #fileReferences = [];

    #uniqueFileReferences = [];

    constructor(filePath) {
        this.#filePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(process.cwd(), filePath);
    }

    async load() {
        try {
            const data = await this.#read();

            this.#id = APW.#getId(data);

            this.#fileReferences = await this.#getFileReferences(data);

            this.#uniqueFileReferences = this.#getUniqueFileReferences();
        } catch (error) {
            throw new Error(`Failed to load APW file: ${error.message}`);
        }
    }

    async #read() {
        const filePath = this.#filePath;

        const exists = await fs.pathExists(filePath);

        if (!exists) {
            throw new Error("File does not exist");
        }

        const data = await fs.readFile(filePath, {
            encoding: "utf8",
        });

        if (!/<!DOCTYPE Workspace \[/.test(data)) {
            throw new Error("Not a Netlinx Workspace file");
        }

        return data;
    }

    static #getId(data) {
        const pattern = /<Workspace.+\r?\n?.*?<Identifier>(?<id>.+)<.+>/m;
        const match = data.match(pattern).groups;

        if (!match) {
            throw new Error("No Workspace ID found");
        }

        return match.id;
    }

    async #getFileReferences(data) {
        const pattern =
            /<File.+Type="(?<type>.+)".+\r?\n?.*?<Identifier>(?<id>.+)<\/Identifier>\r?\n?.*?>(?<path>.+)<.+\r?\n?.*?\r?\n?.*?(?:<DeviceMap.+\r?\n?.*?\r?\n?.*?\r?\n?)?.*?<\/File>/gm;
        const matches = data.matchAll(pattern);

        const fileReferences = [];
        for (const match of matches) {
            const { type, id, path } = match.groups;

            const exists = await fs.pathExists(path);

            fileReferences.push({
                type,
                id,
                path,
                exists,
                extra: false,
            });
        }

        return fileReferences.sort(APW.#sortFileReferences);
    }

    #getUniqueFileReferences() {
        return [
            ...new Map(
                this.#fileReferences.map((file) => [file.path, file]),
            ).values(),
        ];
    }

    static #sortFileReferences(file, nextFile) {
        return file.path.localeCompare(nextFile.path);
    }

    #isInWorkspace(id) {
        return this.#uniqueFileReferences.find(
            (file) => file.id === id || file.path.includes(id),
        );
    }

    async #searchForExtraFileReferences(file, pattern) {
        const data = await fs.readFile(file, { encoding: "utf-8" });

        const matches = data.matchAll(pattern);

        const fileReferences = [];
        for (const match of matches) {
            const { id } = match.groups;

            if (this.#isInWorkspace(id)) {
                continue;
            }

            fileReferences.push(id);
        }

        return [...new Set(fileReferences)];
    }

    static getFileType(file) {
        return APW.fileTypeFromExtension[path.extname(file)];
    }

    static fileIsReadable(file) {
        return path.extname(file) === ".axs" || path.extname(file) === ".axi";
    }

    async getExtraFileReferencesFromFile(file) {
        const extraFiles = [];

        if (!APW.fileIsReadable(file)) {
            return extraFiles;
        }

        const extraIncludeFiles = await this.#searchForExtraFileReferences(
            file,
            /#(?:include).+'(?<id>.+)'/gim,
        );

        const extraModuleFiles = await this.#searchForExtraFileReferences(
            file,
            /^(?:define_module).+'(?<id>.+)'/gim,
        );

        extraFiles.push(...extraIncludeFiles, ...extraModuleFiles);

        return [...new Set(extraFiles)];
    }

    async getExtraFileReferences() {
        const extraFiles = [];

        for (const file of this.#uniqueFileReferences) {
            if (!file.exists) {
                continue;
            }

            extraFiles.push(
                ...(await this.getExtraFileReferencesFromFile(file.path)),
            );
        }

        return [...new Set(extraFiles)];
    }

    get moduleFiles() {
        return this.#uniqueFileReferences.filter(
            (file) => file.type === APW.fileType.module,
        );
    }

    get masterSrcFiles() {
        return this.#uniqueFileReferences.filter(
            (file) => file.type === APW.fileType.masterSrc,
        );
    }

    get allFiles() {
        return [
            ...this.#uniqueFileReferences,
            {
                type: APW.fileType.workspace,
                id: this.#id,
                path: this.#filePath,
                exists: true,
                extra: false,
            },
        ];
    }

    #getFileDirectories(files) {
        const directories = files.map((file) => {
            const rootDirectory = path.dirname(this.#filePath);
            const absoluteFilePath = path.join(rootDirectory, file.path);
            return path.dirname(absoluteFilePath);
        });

        return [...new Set(directories)];
    }

    get includePath() {
        const includeFiles = this.#uniqueFileReferences.filter(
            (file) => file.type === APW.fileType.include,
        );

        return this.#getFileDirectories(includeFiles);
    }

    get masterSrcPath() {
        const masterSrcFiles = this.#uniqueFileReferences.filter(
            (file) => file.type === APW.fileType.masterSrc,
        );

        return this.#getFileDirectories(masterSrcFiles);
    }

    get modulePath() {
        const moduleFiles = this.#uniqueFileReferences.filter(
            (file) =>
                file.type === APW.fileType.module ||
                file.type === APW.fileType.duet ||
                file.type === APW.fileType.xdd,
        );

        return this.#getFileDirectories(moduleFiles);
    }

    get id() {
        return this.#id.replace(" ", "-");
    }

    get totalFileCount() {
        return this.#fileReferences.length;
    }

    get uniqueFileCount() {
        return this.#uniqueFileReferences.length;
    }

    get missingFiles() {
        return this.#uniqueFileReferences.filter((file) => !file.exists);
    }

    get filePath() {
        return this.#filePath;
    }
}

export default APW;

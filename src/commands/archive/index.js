import { Command, Option } from "commander";
import { actions } from "../../actions";

export function archive() {
    const command = new Command("archive");

    command
        .description("generate a NetLinx workspace zip archive")
        .addOption(
            new Option(
                "-w, --workspace-files <string...>",
                "workspace file(s) to generate archive(s) for",
            ).default([], "search for workspace files in current directory"),
        )
        .addOption(
            new Option(
                "-o, --output-file-suffix <string>",
                "output file suffix",
            ),
        )
        .addOption(
            new Option(
                "-s, --include-compiled-source-files",
                "include compiled source files",
            ),
        )
        .addOption(
            new Option(
                "-S, --no-include-compiled-source-files",
                "do not include compiled source files",
            ),
        )
        .addOption(
            new Option(
                "-m, --include-compiled-module-files",
                "include compiled module files",
            ),
        )
        .addOption(
            new Option(
                "-M, --no-include-compiled-module-files",
                "do not include compiled module files",
            ),
        )
        .addOption(
            new Option(
                "-n, --include-files-not-in-workspace",
                "include files not in workspace",
            ),
        )
        .addOption(
            new Option(
                "-N, --no-include-files-not-in-workspace",
                "do not include files not in workspace",
            ),
        )
        .addOption(
            new Option(
                "-l, --extra-file-search-locations <string...>",
                "extra file locations to search",
            ),
        )
        .addOption(
            new Option(
                "-p, --extra-file-archive-location <string>",
                "location to place extra files in the archive",
            ),
        )
        .action((options) => actions.archive.create(options));

    return command;
}

export default archive;

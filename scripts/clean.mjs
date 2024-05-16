import { rm } from "fs/promises";


async function cleanDirectory (
    directory
) {
    await rm(
        directory,
        {
            force: true,
            recursive: true
        }
    );
}


async function main () {
    cleanDirectory("docs/");
    cleanDirectory("packages/");
}


main();

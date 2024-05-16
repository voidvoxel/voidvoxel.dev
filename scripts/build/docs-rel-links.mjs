import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";


async function createDirectory (
    directory
) {
    directory = path.resolve(directory);

    if (!existsSync(directory)) {
        await mkdir(
            directory,
            {
                recursive: true
            }
        );
    }
}


async function generateHTML (
    moduleBaseName,
    directoryName,
    outputDirectory,
    options = {}
) {
    // Set default options.
    options ??= {};
    const gitRepositoryTag = options.gitRepositoryTag = "channel/release";
    const linkDirectoryName = options.linkDir = directoryName;

    // Read the HTML template file.
    let html = await readFile(
        "templates/docs-rel-link.html",
        "utf-8"
    );

    // Apply argument `directoryName`.
    html = html.replaceAll(
        "$_DIRECTORY_NAME",
        JSON.stringify(directoryName)
    );

    // Apply option `gitRepositoryTag`.
    html = html.replaceAll(
        "$_GIT_REPOSITORY_TAG",
        JSON.stringify(gitRepositoryTag)
    );

    // Apply argument `moduleBaseName`.
    html = html.replaceAll(
        "$_MODULE_BASE_NAME",
        JSON.stringify(moduleBaseName)
    );

    // Apply option `linkDirectoryName`.
    html = html.replaceAll(
        "$_LINK_DIRECTORY_NAME",
        JSON.stringify(linkDirectoryName)
    );

    // Write the output file to redirect browsers.
    await writeFile(
        path.resolve(
            path.join(
                outputDirectory,
                directoryName,
                "index.html"
            )
        ),
        html,
        "utf-8"
    );
}


async function main (args) {
    if (args.length < 1) {
        throw new Error("Script requires at least 1 argument.");
    }

    const moduleBaseName = args[0];

    const outDir = `docs/docs/${moduleBaseName}`;
    const outDirDocs = `${outDir}/docs/`;
    const outDirExamples = `${outDir}/examples/`;

    await createDirectory(outDirDocs);
    await createDirectory(outDirExamples);

    await generateHTML(
        moduleBaseName,
        "docs",
        outDir,
        {
            linkDir: "docs/md"
        }
    );

    await generateHTML(
        moduleBaseName,
        "examples",
        outDir
    );
}


const args = process.argv.splice(2);

main(args);

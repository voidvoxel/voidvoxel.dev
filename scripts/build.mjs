/* Runtime dependencies */

import {
    fork
} from "child_process";

import {
    existsSync
} from "fs";

import {
    copyFile,
    mkdir,
    rename,
    rm
} from "fs/promises";

import path from "path";


/* External dependencies */

import {
    glob
} from "glob";


/* Internal dependencies */

import {
    download
} from "./lib/download.mjs";


/* Private functions */

async function buildDocs (
    moduleBaseName
) {
    // Move the downloaded package documentation into `dist/`.
    await rename(
        `packages/${moduleBaseName}/docs/html`,
        `dist/docs/${moduleBaseName}`
    );

    // Start script "build/docs-rel-links".
    const subprocess = fork(
        "scripts/build/docs-rel-links.mjs",
        [
            moduleBaseName
        ]
    );

    // Return a `Promise`.
    return new Promise(
        (resolve, reject) => {
            // On event "error", reject.
            subprocess.on(
                "error",
                error => reject(error.message)
            );

            // On event "exit", either reject or resolve.
            subprocess.on(
                "exit",
                exitCode => exitCode
                    // If a non-zero exit code was returned, reject.
                    ? reject(`The script returned with exit code ${exitCode}`)
                    // Otherwise, the exit code was zero, so resolve.
                    : resolve()
            );
        }
    );
}


async function buildExamples (
    moduleBaseName
) {
    // Move the downloaded package examples into `docs/`.
    await rename(
        `packages/${moduleBaseName}/examples`,
        `dist/examples/${moduleBaseName}`
    );
}


async function copySrcToDist (
    ...patterns
) {
    // Get a list of `.html` files in `src/`.
    const srcFiles = [];

    // Add all source files to the list.
    for (
        let pattern of patterns
    ) {
        const filePaths = await glob(
            `src/${pattern}`
        );

        srcFiles.push(
            ...filePaths
        );
    }

    // Get a list of `.html` files in `src/`.
    const distFiles
        =   srcFiles
        .map(
            filePath => filePath.replace(
                "src",
                "dist"
            )
        );

    // Copy each `.html` file from to `dist/`.
    for (
        let i = 0;
        i < srcFiles.length;
        i++
    ) {
        const srcFile = srcFiles[i];
        const distFile = distFiles[i];

        // Copy each `.html` file from to `dist/`.
        await copyFile(
            srcFile,
            distFile
        );
    }
}


async function build (
    moduleBaseName
) {
    const packageName = moduleBaseName;
    const repositoryName = moduleBaseName;

    // If `dist/docs/` not exist, create it.
    const distDocsDir = path.resolve(
        path.join(
            "dist",
            "docs"
        )
    );

    // If the directory doesn't exist, create it.
    if (!existsSync(distDocsDir)) {
        await mkdir(
            distDocsDir,
            {
                recursive: true
            }
        );
    }

    // If `dist/examples/` not exist, create it.
    const distExamplesDir = path.resolve(
        path.join(
            "dist",
            "examples"
        )
    );

    // If the directory doesn't exist, create it.
    if (!existsSync(distExamplesDir)) {
        // Create the directory.
        await mkdir(
            distExamplesDir,
            {
                recursive: true
            }
        );
    }

    // Download the module.
    await download(
        {
            packageName,
            repositoryName
        }
    );

    // Build the documentation for this module.
    await buildDocs(moduleBaseName);

    // Build the examples for this module.
    await buildExamples(moduleBaseName);

    // Copy all `.html` files from `src/` to `dist/`.
    await copySrcToDist("**/*.html");
}


/* Program */

async function main (args) {
    // If `args.length` < 1, then throw an `Error`.
    if (args.length < 1) {
        throw new Error("This script requires at least 1 argument.");
    }

    // Get the module's base name.
    const moduleBaseName = encodeURIComponent(args[0]);

    // Build all website components related to the module.
    await build(moduleBaseName);

    // Cleanup script resources on exit.
    process.on(
        "exit",
        async () => {
            // Remove the package's directory.
            await rm(
                path.resolve(
                    path.join(
                        "packages",
                        moduleBaseName
                    )
                ),
                {
                    force: true,
                    recursive: true
                }
            );
        }
    );
}


const args = process.argv.splice(2);

main(args);

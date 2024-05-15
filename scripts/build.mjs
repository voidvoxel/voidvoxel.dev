import { mkdir, rename, rm } from "fs/promises";
import { download } from "./lib/download.mjs";
import { existsSync } from "fs";
import path from "path";
import { fork } from "child_process";


async function buildDocs (
    moduleBaseName
) {
    await rename(
        `packages/${moduleBaseName}/docs/html`,
        `dist/docs/${moduleBaseName}`
    );

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
    await rename(
        `packages/${moduleBaseName}/examples`,
        `dist/examples/${moduleBaseName}`
    );
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

    if (!existsSync(distExamplesDir)) {
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
}


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

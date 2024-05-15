import { spawn } from "child_process";
import * as semver from "semver";


export async function download (
    options = {}
) {
    // Set default options.
    options ??= {};
    options.packageName ??= null;
    options.repositoryName ??= null;

    // Get the package name.
    const packageName
        =   options.packageName?.toString()
        ??  null
    ;

    // If `packageName` is not set, throw an error.
    if (!packageName) {
        // Throw the error.
        throw new Error("Option `packageName` must be provided.");
    }

    // Get the repository name.
    const repositoryName
        =   options.repositoryName?.toString()
        ??  null
    ;

    // If `repositoryName` is set, download the package from GitHub.
    if (repositoryName) {
        // Download the package from GitHub.
        return await downloadGitHub(options);
    }

    // Throw an error if we've failed to resolve the package by now.
    throw new Error("Not yet implemented.");
}


export async function downloadGitHub (
    options = {}
) {
    // Set default options.
    options ??= {};
    options.packageName ??= null;
    options.repositoryName ??= null;

    // Get the package name.
    const packageName
        =   options.packageName?.toString()
        ??  null
    ;

    // If `packageName` is not set, throw an error.
    if (!packageName) {
        // Throw the error.
        throw new Error("Option `packageName` must be provided.");
    }

    // Get the repository name.
    const repositoryName
        =   options.repositoryName?.toString()
        ??  null
    ;

    // My repositories are currently hosted on `github.com`.
    let urlString = `https://github.com/voidvoxel/${repositoryName}`;

    // Was a tag provided?
    let tag = options.tag ?? null;

    // Was a version provided?
    const version = options.version ?? null;

    // If both `tag` and `version` are set, throw an `Error`.
    if (tag && version) {
        // Create the error message.
        const errorMessage
            = "Options "
            + "`tag` and `version` "
            + "are incompatible. "
            + "To resolve this error, "
            + "please choose one option to keep and remove the other.";

        // Throw the error.
        throw new Error(errorMessage);
    }

    // If a version was provided, update the Git tag.
    if (version) {
        // If the version is invalid, throw an error.
        if (!semver.valid(version)) {
            // Throw the error.
            throw new Error(`Invalid version "${version}".`);
        }

        // Set `tag` to `"v{version}"`.
        tag = 'v' + version;
    }

    // If a tag was provided, add it to the URL.
    if (typeof tag === "string") {
        // Create the component to append to the URL.
        const component = '#' + tag;

        // Add the component to the URL.
        urlString += component;
    }

    // Validate the URL string.
    const url = new URL(urlString);

    // git clone {url.toString()} packages/{packageName}
    const subprocess = await spawn(
        "git",
        [
            "clone",
            url.toString(),
            `packages/${packageName}`
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
                    ? (() => {
                        // If `git` returned exit code 128,
                        // this means that the directory already exists.
                        if (exitCode === 128) {
                            resolve();
                        }

                        reject();
                    })()
                    // Otherwise, the exit code was zero, so resolve.
                    : resolve()
            );
        }
    );
}

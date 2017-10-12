
var fs = require("fs-extra");
var which = require("which");
require("dirutils"); // appends to process object.
var spawnSync = require("child_process").spawnSync;

//
// Check that dependencies are installed.
//

var gitPath = which.sync("git", { nothrow: true });
if (!gitPath) {
    throw new Error("`git` not found on path, Cannot clone `xi-editor` repo.");
}

var cargoPath = which.sync("cargo", { nothrow: true });
if (!cargoPath) {
    throw new Error("`cargo` not found on path, Cannot build `xi-editor`.");
}

//
// Clone and build xi-core
//

var result;

let xiCoreDir = "./.xi-core/";
fs.emptyDirSync(xiCoreDir);
result = spawnSync("git", ["clone", "https://github.com/google/xi-editor.git", xiCoreDir], { encoding: 'utf8', stdio: 'inherit' });
if (result.status !== 0) {
    throw result.error || new Error("cloning `xi-editor` failed");
}

let xiCoreRustDir = xiCoreDir + "rust/";

process.pushdir(xiCoreRustDir);

result = spawnSync("cargo", ["build"], { encoding: 'utf8', stdio: 'inherit' });
if (result.status !== 0) {
    throw result.error || new Error("cloning `xi-editor` failed");
}

process.popdir();

//
// Copy binaries to src.
//

let xiCoreOutDir = "./src/xi-core";
fs.removeSync(xiCoreOutDir);
fs.ensureDirSync(xiCoreOutDir);
fs.copySync(xiCoreRustDir + "target/debug", xiCoreOutDir, {overwrite: true, errorOnExist: false, recursive: true});

console.log("Build complete!");
console.log("The xi-editor core was built and placed in xi-electron/src/xi-core")

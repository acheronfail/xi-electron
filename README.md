# Xi Electron
_A front-end for the xi-editor built with modern web technologies._

NOTE: This is still a WIP!

## Goals of this Repo

* Make a front-end for [`xi-editor`](https://github.com/google/xi-editor) that is consistent across platforms
* Experiement with different editor rendering techniques on the web, specifically:
    - [-] `2d` - `<canvas>` (current implementation)
    - [ ] `WebGL` - `<canvas>`
    - [ ] `DOM` - direct use of the DOM (have a look at [CodeMirror](https://github.com/codemirror/codemirror))
* Hopefully create a functional mobile friendly version that is fast and pleasant to use

The main motivation for this repo is to experiment and profile the speeds and performance of different rendering techniques in the browser, specifically with modern HTML5 APIs and the like. The final goal would be a fully cross-platform (desktop+mobile) text editing experience, but this is still a long hope at this stage.

## Demo

![XiEditor](./demo/demo.png)

NOTE: image not up to date, this is the original implementation (found in `v1` branch).

## Getting started

To build and run `xi-electron` you'll need to have [NodeJS](https://nodejs.org) installed (Node version 6 or greater) as well as `Git`.

To get started, simply run:

```bash
> git clone https://gitlab.com/callodacity/xi-electron
> cd xi-electron
> git submodule init
> git submodule update
> npm install
> npm run make # or to run in dev mode use: npm run start
```

The built app will be output to `xi-electron/out/`.

## Building `xi-core`

Keep in mind you'll need [Rust](https://www.rust-lang.org/) (version 1.20+ is recommended at the moment). On macOS platforms you'll need [Xcode 8.2](https://developer.apple.com/xcode/) and other relevant build tools.

This should automatically be done via `scripts/postinstall.js` once the node dependencies have been installed. You can re-run this script anytime you like. [`xi-editor`](https://github.com/google/xi-editor) is currently placed in this repository as a submodule, so we can have a "somewhat" stable experience. 

If you'd like to build and use a more recent version of `xi-editor` then just place it under `src/xi-core`. For building `xi-editor` manually [refer to its instructions](https://github.com/google/xi-editor#building-the-core).

## Contributing

Please! 🙏

## Credits

* All credits for the [xi-editor](https://github.com/google/xi-editor) go to Raph Levien.

## License

[MIT](LICENSE.md)

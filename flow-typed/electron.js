// Since "electron-forge" resolves "electron" to "electron-compile" we need to
// create a placeholder for it.
declare module 'electron' {
  declare module.exports: any;
}

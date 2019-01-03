module.exports = {
  make_targets: {
    win32: ['squirrel'],
    darwin: ['zip', 'dmg'],
    linux: ['deb', 'rpm']
  },
  electronPackagerConfig: {
    packageManager: 'yarn',
    appBundleId: 'io.acheronfail.xi-electron',
    ignore: [/\/xi-editor\//]
  },
  electronWinstallerConfig: {
    name: 'xi_electron'
  },
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  github_repository: {
    owner: 'acheronfail',
    name: 'xi-electron'
  },
  windowsStoreConfig: {
    packageName: 'io.acheronfail.xi-electron',
    name: 'xi_electron'
  }
}

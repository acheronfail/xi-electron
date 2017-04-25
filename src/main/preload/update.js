/**
 * This script is called at three times:
 * 1: after app install
 * 2: after app update
 * 3: after app reset
 *
 * It writes the default package configuration files.
 */


console.log('Running update script...');

// TODO: ensure this script is called correctly.

import path from 'path';
import fs from 'fs-extra';
import * as ENV from '../../common/environment';

// Overwrite existing files.
const opts = { flag: 'w' };

/**
 * Update the default preferences file.
 */

 fs.readFile(ENV.ASSET_DEFAULT_PREFS, 'utf8', (err, data) => {
   fs.outputFile(ENV.PREFS_DEFAULT_PATH, data, opts, (err) => {
     if (err && err.code != 'EEXIST') throw err;
   });
 });

/**
 * Update the default ui theme.
 */

const DEFAULT_THEME_UI = `
$background: #282828;

// UI.
.xi-workspace {
  background: $background;
}

$tabBackgroundColor: #373737;
$activeTabBackgroundColor: #505050;

// Tabs.
.xi-tabs-container {
  background: $background;

  .xi-tabs-bottom-bar {
    background: $activeTabBackgroundColor;
    border-color: #000;
  }

  .xi-tab {
    // New tab button.
    &.xi-new-tab {
      // On click.
      &:active svg .xi-tab-background {
        fill: $activeTabBackgroundColor;
      }
    }

    // Normal tab.
    .xi-tab-background > svg {
      // backgorund color.
      .xi-tab-background { fill: $tabBackgroundColor; }
       // outline color.
      .xi-tab-shadow { stroke: #000; }
    }

    // Selected tab.
    &.xi-tab-selected .xi-tab-background > svg {
      .xi-tab-background {
        fill: $activeTabBackgroundColor;
      }
    }
  }

  // Tab title.
  .xi-tab-title {
    -webkit-font-smoothing: antialiased;
    color: #fff;
  }

  // Tab close button.
  .xi-tab-close {
    color: #cfcfcf;
  }
}
`;

fs.outputFile(ENV.DEFAULT_THEME_UI, DEFAULT_THEME_UI, opts, (err) => {
  if (err) throw err;
});

/**
 * Update the default syntax theme.
 */

const DEFAULT_THEME_SYNTAX = `
.xi-line-view {
  // ...
}
`;

fs.outputFile(ENV.DEFAULT_THEME_SYNTAX, DEFAULT_THEME_SYNTAX, opts, (err) => {
  if (err) throw err;
});

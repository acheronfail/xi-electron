/**
 * This script is called at three times:
 * 1: after app install
 * 2: after app update
 * 3: after app reset
 *
 * It writes the default package configuration files.
 */

import * as ENV from '../common/environment';

module.exports = function update(UPDATE_ENV, settings) {
  // No need to update.
  if (UPDATE_ENV === ENV.UPDATE_NONE) return;

  console.log('Running update script...', UPDATE_ENV);

  const path = require('path');
  const app = require('electron').app;
  const fs = require('fs-extra');

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

   // Default Dark Theme
   const DEFAULT_THEME_UI = `
   $background: #282828;

  // UI.
  .xi-workspace {
    // The app container.
  }

  // Tabs.
  .xi-tabs-container {
    // Element that contains the tabs (behind the tabs themselves).

    .xi-tabs-bottom-bar {
      // The bottom bar that separates the tabs from the view.
      // background: #f2f2f2;
      // border-color: #b7b7b7;
    }

    // The tabs themselves:
    .xi-tab {
      // New tab button.
      &.xi-new-tab {
        // An SVG element. Here's an example of theming it's when
        // it's clicked.
        &:active svg .xi-tab-background {
          // fill: #f2f2f2;
        }
      }

      // Normal tab. Also an SVG.
      .xi-tab-background > svg {
        // Default backgorund color of the tab.
        .xi-tab-background { fill: #d0d0d0; }
         // Default outline color of the tab.
        .xi-tab-shadow { stroke: rgba(0, 0, 0, 0.27); }
      }

      // Selected tab.
      &.xi-tab-selected .xi-tab-background > svg {
        .xi-tab-background {
          fill: #f2f2f2;
        }
      }
    }

    // Tab title. The element containing the tab's text.
    .xi-tab-title {
      // color: #fff;
    }

    // Tab close button.
    .xi-tab-close {
      // color: #cfcfcf;
    }
  }
   `;

   fs.outputFile(ENV.DEFAULT_THEME_UI, DEFAULT_THEME_UI, opts, (err) => {
     if (err) throw err;
   });

  // Default Dark Theme
  const DEFAULT_THEME_UI_DARK = `
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

  fs.outputFile(ENV.DEFAULT_THEME_UI_DARK, DEFAULT_THEME_UI_DARK, opts, (err) => {
    if (err) throw err;
  });

  /**
   * Update the default syntax theme.
   */

  // Default Light Theme.
  const DEFAULT_THEME_SYNTAX = `
  .xi-line-view {
    // ...
  }
  `;

  fs.outputFile(ENV.DEFAULT_THEME_SYNTAX, DEFAULT_THEME_SYNTAX, opts, (err) => {
    if (err) throw err;
  });

  // Default Dark Theme.
  const DEFAULT_THEME_SYNTAX_DARK = `
  .xi-line-view {
    // ...
  }
  `;

  fs.outputFile(ENV.DEFAULT_THEME_SYNTAX_DARK, DEFAULT_THEME_SYNTAX_DARK, opts, (err) => {
    if (err) throw err;
  });


  // Set settings to reflect update status.
  if (UPDATE_ENV == ENV.UPDATE_FIRST) {
    settings.set('UPDATE_FIRST', true);
  }

  settings.set('UPDATE_LAST', Date.now());
  settings.set('UPDATE_VERSION', app.getVersion());

  settings.save();
}

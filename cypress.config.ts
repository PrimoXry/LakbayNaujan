import { defineConfig } from 'cypress';

export default defineConfig({
  fixturesFolder: 'tests/e2e/fixtures',
  e2e: {
    supportFile: 'tests/e2e/support/e2e.{js,jsx,ts,tsx}',
    specPattern: 'tests/e2e/specs/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: '.tmp/cypress/videos',
    screenshotsFolder: '.tmp/cypress/screenshots',
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron' && browser.isHeadless) {
          launchOptions.preferences.width = 1440;
          launchOptions.preferences.height = 1000;
        }
        return launchOptions;
      });
    },
  },
});

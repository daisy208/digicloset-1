module.exports = {
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000,
  },
  retries: 1,
  testDir: './tests'
}

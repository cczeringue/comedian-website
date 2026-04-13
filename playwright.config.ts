import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://127.0.0.1:3333',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'Mobile WebKit',
            use: {
                ...devices['iPhone 12'],
                browserName: 'webkit',
            },
        },
    ],
    webServer: {
        command: 'npx serve . -p 3333',
        url: 'http://127.0.0.1:3333',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});

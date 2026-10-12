import { defineConfig } from '@playwright/test';

export default defineConfig({ testDir: './e2e', testMatch: 'website-catalog.spec.ts', timeout: 60000, workers: 1 });

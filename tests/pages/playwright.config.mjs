import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
export default defineConfig({testDir:'.',testMatch:'*.spec.mjs',use:{baseURL:'http://127.0.0.1:8087'},webServer:{command:'python -m http.server 8087 --bind 127.0.0.1',cwd:fileURLToPath(new URL('../../',import.meta.url)),url:'http://127.0.0.1:8087',reuseExistingServer:false}});

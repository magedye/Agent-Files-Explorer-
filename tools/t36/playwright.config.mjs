import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'browser.spec.mjs',workers:1,retries:0,timeout:300000,globalTimeout:600000,reporter:[['line']],use:{browserName:'chromium',channel:'msedge',headless:true,viewport:{width:1440,height:1000},trace:'off',video:'off',screenshot:'off'},outputDir:'../../temp/t36-playwright-output'});

import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'legacy.spec.mjs',workers:1,retries:0,timeout:120000,reporter:[['line']],use:{browserName:'chromium',channel:'msedge',headless:true,trace:'off',video:'off',screenshot:'off'},outputDir:'../../temp/t36-legacy-output'});

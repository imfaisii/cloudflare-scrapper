import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { cl } from './helpers/global.js';
import { loadPageAndWaitForCaptcheToload, bypassCF } from './helpers/cloudflare.js';

puppeteer.use(StealthPlugin())

try {
    (async () => {
        const browser = await puppeteer.launch({ headless: false })
        const page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 800 })
        await page.setRequestInterception(true);

        page.on('request', (request) => {
            request.url().includes('challenges.css')
                ? request.abort()
                : request.continue();
        });

        await loadPageAndWaitForCaptcheToload(page, 'https://cf.url')

        if (await page.$("#checkbox") !== null) {
            // hcaptcha
            await loadPageAndWaitForCaptcheToload(page, 'https://cf.url')
        } else if (await page.$("iframe") !== null) {
            // cf
            await bypassCF(page)
        }

        cl("Bypasseeddd....")

    })()
} catch (err) {
    console.error(err)
}
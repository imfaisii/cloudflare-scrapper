import { CLOUFLARE_WAIT_TIME } from '../constants/global.js';
import { cl, sleep } from './global.js'

export const loadPageAndWaitForCaptcheToload = async (page, url) => {
    await page.goto(url, { waitUntil: 'networkidle2' })

    cl(`Waiting for ${CLOUFLARE_WAIT_TIME / 1000} seconds to get captcha loaded....`)

    await sleep(CLOUFLARE_WAIT_TIME)
}

export const bypassCF = async (page) => {
    try {
        const iframeElement = await page.$('iframe');
        const frame = await iframeElement.contentFrame();
        await frame.$eval('input[type=checkbox]', input => input.click());
    } catch (e) {
        cl(e?.message ?? 'CLOUDFLARE: Elements not found.')
    }

}
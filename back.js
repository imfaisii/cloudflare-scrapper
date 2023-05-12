import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { chunkArray, cl, sleep } from './helpers/global.js';
import fs from 'fs'
import csv from 'csv-parser'
import { bypassCF } from './helpers/cloudflare.js';
import { BASE_URL } from './constants/global.js';
import cheerio from 'cheerio';

puppeteer.use(StealthPlugin())

const scrapNow = async (pageContent, queryString) => {
    const $ = cheerio.load(pageContent);
    const products = []
    var name = ''
    var price = ''
    let totalPushed = 0;

    $('.list_products li').each(function () {
        $(this).find('.name > .ga-click').each((i, el) => {
            name = $(el).text().trim().split(/\s{2,}/)[0].replace(",", " ");
        })

        $(this).find('.price_box .price p').each((i, el) => {
            price = $(el).text().trim().replace(",", ".");
        })


        if (!products.some(obj => obj.name === name)) {
            if (totalPushed < 5) {
                products.push({ search: queryString, name, price });
                totalPushed++;
            }
        }
    })

    const rows = products.map(obj => Object.values(obj).join(',') + '\n').join('') + '\n';

    fs.appendFile('./output/result.csv', rows, (err) => {
        if (err) throw err;
    });
    fs.appendFile('./output/done.txt', queryString + '\n', function (err) {
        if (err) throw err;
    });

    cl(`COMPLETED: ${queryString}`)
}

const setupPuppeteer = async (strings, done) => {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    cl(`LAUNCHED BROWSER`)

    await page.setRequestInterception(true);

    page.on('request', async (request) => {
        request.url().includes('.css')
            || request.url().includes('.png')
            || request.url().includes('.jpg')
            ? request.abort()
            : request.continue()
    });

    for (const queryString of strings) {
        if (!done.includes(queryString)) {
            cl(`SCRAPPING: ${BASE_URL}${queryString}`)
            await page.goto(`${BASE_URL}${queryString}`, { waitUntil: 'networkidle2' })

            await waitForSelector(page, '.header-links')
            scrapNow(await page.content(), queryString)
        }
    }
}

async function waitForSelector(page, selector) {
    while (true) {
        try {
            await page.waitForSelector(selector, { timeout: 5000 });
            break;
        } catch (err) {
            cl(`Selector ${selector} not found. Reloading page...`);
            await page.reload({ waitUntil: "networkidle0" })
        }
    }
}

try {
    (async () => {
        const results = [];
        const done = [];

        fs.createReadStream('./output/done.txt')
            .pipe(csv())
            .on('data', (data) => done.push(Object.values(data)[0]))
            .on('end', () => {
                fs.createReadStream('./input/search-strings.csv')
                    .pipe(csv())
                    .on('data', (data) => results.push(Object.values(data)[0].replace(";", "+")))
                    .on('end', () => setupPuppeteer(results, done))
            })
    })()
} catch (err) {
    console.error(err)
}
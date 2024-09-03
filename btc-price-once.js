import puppeteer from "puppeteer-core";

async function launchBrowser() {
    return await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: false,
        args: ['--disable-gpu', '--no-sandbox']
    });
}

(async () => {
    let browser = await launchBrowser([]);

    let defaultPage = (await browser.pages())[0];
    await defaultPage.goto('https://binance.com');
    await defaultPage.waitForSelector('#top_crypto_table-1-BTC_USDT');
    let price = await defaultPage.evaluate(() => {
        let text = document.querySelector('#top_crypto_table-1-BTC_USDT > div:nth-child(2) > div:nth-child(1)').innerText
        return text
    });
    console.log('PRICE: ' + price);
    await browser.close();
})();

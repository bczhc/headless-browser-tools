import puppeteer from "puppeteer-core";

async function launchBrowser() {
    return await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: false,
        args: ['--no-proxy-server', '--disable-gpu', '--no-sandbox']
    });
}

(async () => {
    let browser = await launchBrowser([]);

    let defaultPage = (await browser.pages())[0];
    await defaultPage.goto('https://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=1&tn=baidu&wd=%E5%A4%A9%E6%B0%94');
    let newPage = await browser.newPage();
    await newPage.goto('https://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=1&tn=baidu&wd=%E5%A4%A9%E6%B0%94');
    await newPage.waitForSelector('.cu-mr-base');
    let infoText = await newPage.evaluate(() => {
        let elements = document.getElementsByClassName('cu-mr-base');
        return elements[0].innerText + ' ' + elements[1].innerText;
    });
    console.log('INFO TEXT: ' + infoText);
    await browser.close();
})();

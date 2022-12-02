import puppeteer from "puppeteer-core";

let USERNAME;
let PASSWORD;

async function asyncSleep(millis) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, millis)
    });
}

let url = 'http://ehall.ccit.js.cn/ywtb-portal/standard/index.html?browser=no#/home/home';

async function launchBrowser() {
    return await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: true,
        args: ['--no-proxy-server', '--disable-gpu', '--no-sandbox']
    });
}

async function loadPage(browser) {
    let page = (await browser.pages())[0];
    await page.goto(url);
    return page;
}

async function login(page) {
    await page.waitForSelector('#username');
    await page.waitForSelector('#password');
    let submitSelector = '.auth_login_btn[type=submit]';
    await page.waitForSelector(submitSelector);
    page.evaluate((s, username, password) => {
        $('#username').val(username);
        $('#password').val(password);
        $(s).click();
    }, submitSelector, USERNAME, PASSWORD);
}


// ---------- main -----------


let argv = process.argv.slice(2);
if (argv.length === 0) {
    console.log('Usage: command <username> <password>');
    process.exit(1);
}
USERNAME = argv[0];
PASSWORD = argv[1].trimEnd();


let browser = await launchBrowser();
let page = await loadPage(browser);
await login(page);

await page.waitForSelector('div[title="点击查看消费流水>>"]');
await page.waitForNetworkIdle();

let balance = await page.evaluate(() => {
    let r = /账户余额为:([0-9]*\.[0-9]*)元/;
    return Array.from(document.querySelectorAll('div')).map(x => x.title).filter(x => r.test(x))[0].match(r)[1];
});

await browser.close();

console.log(balance);

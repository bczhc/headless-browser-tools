import puppeteer from "puppeteer-core";

let USERNAME;
let PASSWORD;
let HEADLESS = true;

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
        headless: HEADLESS,
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
    console.log('Usage: command <username> <password> <headless-flag>');
    process.exit(1);
}
USERNAME = argv[0];
PASSWORD = argv[1];
if (argv[2] === 'false') {
    HEADLESS = false;
}


let browser = await launchBrowser();
let page = await loadPage(browser);
await login(page);

page.on('response', async response => {
    if (response.url().includes('getViewDataDetail')) {
        let json = await response.json();
        console.error("Received response");
        try {
            let r = /账户余额为:([0-9]*\.[0-9]*)元/;
            let subtitle = json['data'][0]['subTitle'];
            if (r.test(subtitle)) {
                console.log(subtitle.match(r)[1]);
                await browser.close();
            }
        } catch (ignored) {}
    }
});


import puppeteer from "puppeteer-core";

let USERNAME;
let PASSWORD;
let HEADLESS = true;

const PC_UA = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.71 Mobile Safari/537.36';

async function asyncSleep(millis) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, millis)
    });
}

async function launchBrowser() {
    return await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: HEADLESS,
        args: ['--no-proxy-server', '--disable-gpu', '--no-sandbox', `--user-agent=\"${ANDROID_UA}\"`],
    });
}

async function loadLoginPage(browser, ua) {
    let page = (await browser.pages())[0];
    await page.setUserAgent(ua);
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

let url = 'http://ehall.ccit.js.cn/ywtb-portal/standard/index.html?browser=no#/online';

let browser = await launchBrowser();

browser.on('targetcreated', async e => {
    if (e.type() === 'page') {
        let newPage = await e.page()
        await newPage.setUserAgent(ANDROID_UA);
    }
})

let page = await loadLoginPage(browser, PC_UA);
await page.setUserAgent(ANDROID_UA);
await login(page);

await page.waitForSelector('span[title="一卡通"]');
await page.evaluate(() => {
    document.querySelector('span[title="一卡通"]').click()
    document.querySelector('span[title="一卡通"]').click()
});

for (let p of (await browser.pages())) {
    await p.waitForNetworkIdle();
}

await asyncSleep(1000);

let finalPage = await await browser.newPage();
await finalPage.goto('http://ykt.ccit.js.cn/easytong_webapp/index.html#/payIndex?itemNum=3&itemType=2');

await finalPage.waitForNetworkIdle();

await finalPage.waitForSelector('.area>*:nth-child(1)');
await finalPage.evaluate(() => {
    document.querySelector('.area>*:nth-child(1)').click();
});
await finalPage.waitForSelector('.select-campus>*:nth-child(2)>*:nth-child(1)');
await finalPage.evaluate(() => {
    document.querySelector('.select-campus>*:nth-child(2)>*:nth-child(1)').click()
});

await asyncSleep(3000);

await finalPage.evaluate(() => {
    document.querySelector('.area>*:nth-child(2)').click();
});
await finalPage.evaluate(() => {
    document.querySelector('.select-building>*:nth-child(2)>*:nth-child(11)').click()
});

await asyncSleep(3000);

await finalPage.evaluate(() => {
    document.querySelector('.area>*:nth-child(3)').click();
});
await finalPage.evaluate(() => {
    Array.from(document.querySelectorAll("li")).filter(x => /12-223/.test(x.innerText))[0].click()
});

await asyncSleep(6000);
let result = await finalPage.evaluate(() => {
    return Array.from(document.querySelectorAll('span')).filter(x => x.innerText === '剩余电量(度):')[0].parentElement.children[1].innerText;
});
console.log(result);
// await browser.close();

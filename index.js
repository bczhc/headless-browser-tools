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

let url = 'http://ehall.ccit.js.cn/ywtb-portal/standard/index.html?browser=no#/online';

async function launchBrowser() {
    return await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: false,
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
PASSWORD = argv[1];


let browser = await launchBrowser();
let page = await loadPage(browser);
await login(page);

let selector = 'span[title=我的图书]'
await page.waitForSelector(selector);
await page.evaluate((s) => {
    document.querySelector(s).click();
}, selector);

while ((await browser.pages()).length !== 2) {
    await asyncSleep(1000);
}

let newPage = (await browser.pages())[1];
await newPage.goto('http://opac.ccit.js.cn/reader/book_lst.php');

let fetched = await newPage.evaluate(() => {
    let bookCount = parseInt($('#mylib_content > p:nth-child(4) > b:nth-child(1)').text());
    let borrowLimit = parseInt($('#mylib_content > p:nth-child(4) > b:nth-child(2)').text());
    let books = Array.from($('#mylib_content > table > tbody').children()).slice(1).map(x => {
        let title = $(x.children[1]).text();
        let borrowDate = $(x.children[2]).text();
        let returnDate = $(x.children[3]).text();
        return {
            title: title.trim(),
            borrowDate: borrowDate.trim(),
            returnDate: returnDate.trim(),
        };
    })
    return {
        borrowCount: bookCount,
        totalBorrowCount: borrowLimit,
        books: books
    }
});

await browser.close();

console.log(fetched);

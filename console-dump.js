import puppeteer from "puppeteer-core";

async function launchBrowser(args) {
    return await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: false,
        args: args
    });
}

let argv = process.argv.slice(2);

let registerOnConsoleListener = (page) => {
    page.on('console', async log => {
        try {
            console.log(await log.args()[0].jsonValue());
        } catch (e) {
            console.error(e);
        }
    })
}

(async () => {
    let browser = await launchBrowser(argv);

    let defaultPage = (await browser.pages())[0]
    registerOnConsoleListener(defaultPage);

    browser.on('targetcreated', async e => {
        if (e.type() === 'page') {
            let newPage = await e.page()
            console.error('New page');
            registerOnConsoleListener(newPage);
        }
    })
})();

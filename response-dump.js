import puppeteer from "puppeteer-core";

async function launchBrowser(args) {
    return await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: false,
        args: args
    });
}

let argv = process.argv.slice(2);

let registerOnResponseListener = (page) => {
    page.on('response', async response => {
        try {
            let obj = {
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                bufferBase66: (await response.buffer()).toString('base64')
            }
            console.log(JSON.stringify(obj));
        } catch (e) {
            console.error('Error' + e);
        }
    })
}

(async () => {
    let browser = await launchBrowser(argv);

    let defaultPage = (await browser.pages())[0]
    registerOnResponseListener(defaultPage);

    browser.on('targetcreated', async e => {
        if (e.type() === 'page') {
            let newPage = await e.page()
            console.error('New page');
            registerOnResponseListener(newPage);
        }
    })
})();

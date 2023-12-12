import puppeteer from "puppeteer-core";
import fs from 'fs';

// 文件路径
const filePath = '/tmp/btc-price';

// 更新文件内容的函数
function updateFileContent(newContent) {
    // 打开文件
    fs.open(filePath, 'w', (err, fd) => {
        if (err) {
            console.error('Error opening file:', err);
            return;
        }

        // 截断文件内容
        fs.truncate(fd, 0, (truncateErr) => {
            if (truncateErr) {
                console.error('Error truncating file:', truncateErr);
                fs.close(fd, () => {});
                return;
            }

            // 写入新内容
            fs.write(fd, newContent, (writeErr) => {
                if (writeErr) {
                    console.error('Error writing to file:', writeErr);
                }

                // 关闭文件
                fs.close(fd, () => {});
            });
        });
    });
}

async function launchBrowser(args) {
    return await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: false,
        args: args
    });
}

let registerOnConsoleListener = (page) => {
    page.on('console', async log => {
        try {
            console.log(await log.args()[0].jsonValue());
        } catch (e) {
            console.error(e);
        }

        try {
            let json = await log.args()[0].jsonValue();
            if (json['tag'] === 'btc-price') {
                let price = parseFloat(json['value'].replace(',', ''));
                console.log('price: ' + price);
                updateFileContent(price.toString())
            }
        } catch (e) {
            console.error(e);
        }
    })
}

(async () => {
    let browser = await launchBrowser([]);

    let defaultPage = (await browser.pages())[0];
    registerOnConsoleListener(defaultPage);
    await defaultPage.goto('https://www.binance.com/en/trade/BTC_USDT?_from=markets&type=spot');
    await defaultPage.waitForSelector('.showPrice');
    await defaultPage.evaluate(() => {
        let showPriceDiv = document.querySelector('.showPrice');
        showPriceDiv.addEventListener("DOMCharacterDataModified", function (_) {
            let price = showPriceDiv.innerText;
            console.log({
                tag: 'btc-price',
                value: price,
            })
        });
    });
})();

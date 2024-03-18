import puppeteer from "puppeteer-core";
import fs from 'fs';
import net from 'net';

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

function createServer(onCreated) {
    let writeHandler = [null]

    // Create a TCP server
    const server = net.createServer(socket => {
        console.log('Client connected');

        writeHandler[0] = (line) => {
            socket.write(line + "\n");
        };

        // Handle client disconnection
        socket.on('end', () => {
            console.log('Client disconnected');
        });

        // Handle errors
        socket.on('error', (err) => {
            console.error('Socket error:', err.message);
        });
    });

// Listen for connections on port 3000
    const PORT = 3456;
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);

        onCreated(writeHandler);
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
    createServer(writeLineWrapper => {
        page.on('console', async log => {
            console.log("Console message: " + log.args()[0]);
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
                    if (writeLineWrapper[0] != null) {
                        writeLineWrapper[0](price.toString());
                    }
                }
            } catch (e) {
                console.error(e);
            }
        })
    });
}

(async () => {
    let browser = await launchBrowser([]);

    let defaultPage = (await browser.pages())[0];
    registerOnConsoleListener(defaultPage);
    await defaultPage.goto('https://www.binance.com/zh-CN/futures/BTCUSDT');
    await defaultPage.waitForSelector('.contractPrice');
    await defaultPage.evaluate(() => {
        let showPriceDiv = document.querySelector('.contractPrice');
        showPriceDiv.addEventListener("DOMCharacterDataModified", function (_) {
            let price = showPriceDiv.innerText;
            // console.log gets overriden by Binance
            // and it outputs nothing!!!
            console.error({
                tag: 'btc-price',
                value: price,
            })
        });
    });
})();

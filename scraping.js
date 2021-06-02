
const puppeteer = require("puppeteer");
const fs = require('fs');
const axios = require("axios");


(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: false,
        });

        const page = await browser.newPage();

        // window size
        await page.setViewport({
            width: 1920,
            height: 1080
        });

        let keyWord = "potato"; // Search Keyword

        await page.goto(`https://www.google.com/search?q=${keyWord}`);

        await page.click('#hdtb-msb > div:nth-child(1) > div > div:nth-child(2) > a');
        await page.waitForSelector('#islrg > div.islrc > div:nth-child(1) > a.wXeWr.islib.nfEiy.mM5pbd > div.bRMDJf.islir > img');

        const scHeight = 'document.body.scrollHeight';
        let last_height = await page.evaluate(scHeight); 
        let result = [];
         
        // Infinite scrolling
        // Scroll down
        while (1) {
            
            const scrollHeight = 'document.body.scrollHeight';
            let previousHeight = await page.evaluate(scrollHeight);
            await page.evaluate(`window.scrollTo(0, ${scrollHeight})`);

            await page.waitForTimeout(2000); // loading time
            let new_height = await page.evaluate(scrollHeight);

            if (new_height == last_height) {
                new_height = await page.evaluate(scrollHeight);
                if (new_height == last_height) {
                    break;
                }
            }
            last_height = new_height;
            // 현재 높이



            page.waitForSelector('#islmp > div > div > div > div > div.qvfT1 > div.YstHxe > input');


            var result_plus = await page.$('#islmp > div > div > div > div > div.qvfT1 > div.YstHxe');

            let result_plus_style = await (await result_plus.getProperty('style')).jsonValue();

            if (!result_plus_style[0]) {
                page.click('#islmp > div > div > div > div > div.qvfT1 > div.YstHxe > input'); // result more
            }

            console.log("여기까진..");
        }

        // console.log(a);

        // img tag data
        const data = await page.$$eval('#islrg > div.islrc > div > a.wXeWr.islib.nfEiy.mM5pbd > div.bRMDJf.islir > img', element => {
            let returnArr = [];
            element.map(d => {
                returnArr.push(d.src);
            });
            return returnArr;
        });

        // browser close
        await browser.close();

        let count = 0;

        result = data.filter(n => n);

        result.map(async data => {
            if (data.indexOf("http") === 0) {
                await axios({
                    url: data,
                    method: 'GET',
                    responseType: 'stream'
                })
                    .then(res => {
                        const ext = res.headers['content-type'].split("/")[1];
                        // console.log(res.data);
                        let writeStream = fs.createWriteStream(`./images/${keyWord}${count}.${ext}`);
                        let data = res.data
                        data.pipe(writeStream);
                        count++;
                    })
                    .catch(err => {
                        console.error(err);
                    })

            } else {
                let data64 = data;
                let ext = data64.match(/\/\w+/)[0].replace("/", "");
                let bdata = data64.replace(/^data:image\/\w+;base64,/, "");
                fs.writeFile(`./images/${keyWord}${count}.${ext}`, bdata, { encoding: 'base64' }, (err, result) => {
                    err ? console.error(err) : console.log("Nice save to file ! ");
                });
                count++;
            }
        })

    } catch (err) {
        console.error(err);
    }
})();
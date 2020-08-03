const puppeteer = require('puppeteer');

const options = {
    devtools: false,
    headless: true,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--single-process'
    ]
};

class ExportFile {
    static async exportImage (url, path) {
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.goto(url);
        await page.screenshot({path: path, fullPage: true});
        await browser.close();
    }
    static async exportPdf (url, path) {
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.goto(url);
        await page.pdf({
            path: path, 
            format: 'A4', 
            printBackground: true, 
            margin: { 
                left: '1cm', 
                top: '1cm', 
                right: '1cm', 
                bottom: '1cm' 
            }
        });
        await browser.close();
    }
}


module.exports = {ExportFile};
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  let getDirName = require('path').dirname;
  // const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: false });
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation({
    waitUntil: 'networkidle0',
  });

  const url = 'https://www.gov.br/planalto/pt-br/acompanhe-o-planalto/discursos';
  await page.goto(url, { waitUntil: 'networkidle2' }).catch((e) => void 0);

  await navigationPromise;

  await page.waitForSelector('#content');

  let pagesToScrape = await page.evaluate(() => {
    return document.querySelector('#content-core > ul > li:nth-last-child(2)').innerText;
  });

  await navigationPromise;

  let currentPage = 1;
  let urls = [];

  if (!pagesToScrape) pagesToScrape = 1;

  while (currentPage <= pagesToScrape) {
    let speechList = await page.evaluate(() => {
      let speechesArray = [];
      let items = document.querySelectorAll('#content-core article h2 a');
      items.forEach((i) => {
        speechesArray.push(i.href);
      });
      return speechesArray;
    });

    urls = urls.concat(speechList);

    if (currentPage < pagesToScrape) {
      try {
        await page.waitForSelector('#content-core > ul > li > .proximo'),
          await Promise.all([
            await page.click('#content-core > ul > li > .proximo'),
            await page.waitForSelector('#content-core > article > div > h2 > a'),
          ]);
      } catch (e) {
        console.error(e);
        return;
      }
    }
    currentPage++;
  }

  for (let i = 0; i < urls.length; i++) {
    let articlePage = urls[i];

    await page
      .goto(`${articlePage}`, { waitUntil: 'networkidle2' })
      .catch(async (e) => await page.reload(`${articleLink}`));

    await navigationPromise;
    try {
      const speechText = await page.evaluate(() => {
        return document.querySelector('#parent-fieldname-text').innerText;
      });
      const speechTitle = await page.evaluate(() => {
        return document.querySelector('.documentFirstHeading').innerText;
      });

      writeFile(
        './speeches/jairbolsonaro/' +
          speechTitle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() +
          '_.txt',
        speechText,
        cb
      );
    } catch (e) {
      console.error(e);
    }

    function cb(err) {
      console.error(err ? 'deu ruim' : 'deu bom');
    }

    function writeFile(path, contents, cb) {
      fs.mkdir(
        getDirName(path),
        {
          recursive: true,
        },
        function (err) {
          if (err) return cb(err);

          fs.writeFile(path, contents, cb);
        }
      );
    }
  }

  await browser.close();
})();

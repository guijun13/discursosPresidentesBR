const puppeteer = require('puppeteer');
const fs = require('fs');
const _ = require('lodash');

(async () => {
  let getDirName = require('path').dirname;

  // if you want headless (run only on the terminal)
  // const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });

  // if you want to see the action happening (chrome brownser opens and run the crawler)
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: false });

  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation({
    waitUntil: 'networkidle0',
  });

  const url = `http://www.biblioteca.presidencia.gov.br/presidencia/ex-presidentes`;
  await page.goto(url, { waitUntil: 'networkidle2' }).catch((e) => void 0);

  await navigationPromise;

  await page.waitForSelector('#content');

  await navigationPromise;

  const presidentsMainURLList = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('#content a');
    items.forEach((item) => {
      results.push({
        url: item.href,
      });
    });
    return results;
  });

  // aqui altera o index dos presidentes (ver presidentes.md)
  for (let i = 2; i < presidentsMainURLList.length; i++) {
    const link = presidentsMainURLList[i];
    await page.goto(`${link.url}`, { waitUntil: 'networkidle2' }).catch((e) => void 0);
    await navigationPromise;

    let speechesURLsList = await page.evaluate(() => {
      const yearsLinks = [];
      if (document.querySelectorAll('#f0046f8a875947359dac10a807564bc3')) {
        // tem a parte de 'Discursos presidenciais'
        if (document.querySelectorAll('#f84b41b10df14a67a7250c2b2bf06c07 > div a').length > 1) {
          // tem uma lista de anos
          const itens = document.querySelectorAll('#f84b41b10df14a67a7250c2b2bf06c07 > div a');
          itens.forEach((i) => {
            if (
              i.href !=
                'https://editarcms.presidencia.gov.br/cobib_idg/presidencia/ex-presidentes/costa-silva/resolveuid/5fc9a0e0f68f426f835db4398fd78bfc' &&
              i.href !=
                'https://editarcms.presidencia.gov.br/cobib_idg/presidencia/ex-presidentes/costa-silva/resolveuid/ad9e5d2925084ab89070a5d67e60d285' &&
              i.href !=
                'https://editarcms.presidencia.gov.br/cobib_idg/presidencia/ex-presidentes/itamar-franco/resolveuid/42f4c6ad2a154818b6e9c51f058fe6e3'
            ) {
              yearsLinks.push({
                url: i.href,
              });
            }
          });
          return yearsLinks;
        } else if (document.querySelector('#f84b41b10df14a67a7250c2b2bf06c07 > div a')) {
          // tem so 1 link
          return document.querySelector('#f84b41b10df14a67a7250c2b2bf06c07 > div a:first-child')
            .href;
        } else if (document.querySelector('#deb109d1f040406289d97ebace0ee003')) {
          const itens = document.querySelectorAll('#deb109d1f040406289d97ebace0ee003 a');
          itens.forEach((i) => {
            yearsLinks.push({
              url: i.href,
            });
          });
          return yearsLinks;
        }
      } else {
        return;
      }
    });

    // se for o pres. FHC, tem q fazer uma manipulacao especial
    if (
      speechesURLsList ==
      'http://www.biblioteca.presidencia.gov.br/presidencia/ex-presidentes/fernando-henrique-cardoso/discursos/discursos'
    ) {
      await page.goto(
        'http://www.biblioteca.presidencia.gov.br/presidencia/ex-presidentes/fernando-henrique-cardoso/discursos/discursos'
      );

      await page.waitForSelector('#parent-fieldname-text');

      let speechYearsFHC = await page.evaluate(() => {
        const yearsLinksFHC = [];
        const links = document.querySelectorAll('#parent-fieldname-text > ul > li a');
        links.forEach((link) => {
          yearsLinksFHC.push({
            url: link.href,
          });
        });
        return yearsLinksFHC;
      });

      speechesURLsList = speechYearsFHC;
    }

    let lenghtSpeechesURLsList;
    if (speechesURLsList) {
      if (speechesURLsList.length > 1) {
        lenghtSpeechesURLsList = speechesURLsList.length;
      } else {
        lenghtSpeechesURLsList = 1;
      }
    }

    await navigationPromise;

    for (let j = 0; j < lenghtSpeechesURLsList; j++) {
      let link = speechesURLsList[j];
      await page.goto(`${link.url}`, { waitUntil: 'networkidle2' }).catch((e) => void 0);

      await navigationPromise;

      let pagesToScrape = await page.evaluate(() => {
        // pegar o numero de paginas
        if (document.querySelector('#content-core > ul > li:nth-last-child(2)')) {
          return document.querySelector('#content-core > ul > li:nth-last-child(2)').innerText;
        } else {
          return;
        }
      });

      await navigationPromise;

      let currentPage = 1;
      let urls = [];

      if (!pagesToScrape) {
        pagesToScrape = 1;
      }

      while (currentPage <= pagesToScrape) {
        let speechesList = await page.evaluate(() => {
          let speechTextList = [];
          let items = document.querySelectorAll('#content-core a.summary.url');
          items.forEach((item) => {
            speechTextList.push(item.href);
          });
          return speechTextList;
        });

        urls = urls.concat(speechesList);

        if (currentPage < pagesToScrape) {
          try {
            await page.waitForSelector('#content-core > ul > li:last-child'),
              await Promise.all([
                await page.click('#content-core > ul > li:last-child'),
                await page.waitForSelector('#content-core a.summary.url'),
              ]);
          } catch (error) {
            return;
          }
        }
        currentPage++;
      }

      await navigationPromise;

      for (let k = 0; k < urls.length; k++) {
        let articleLink = urls[k];

        await page
          .goto(`${articleLink}`, { waitUntil: 'networkidle2' })
          .catch(async (e) => await page.reload(`${articleLink}`));

        await navigationPromise;
        try {
          if (await page.$('#content-core > p > a')) {
            // pdf
            const presidentName = await page.evaluate(() => {
              return document.querySelector('#breadcrumbs-3 a').innerText;
            });
            const articleYear = await page.evaluate(() => {
              return parseInt(document.querySelector('#breadcrumbs-5 > a').innerText) > 1000
                ? document.querySelector('#breadcrumbs-5 > a').innerText
                : document.querySelector('#breadcrumbs-6 > a').innerText;
            });

            await page._client.send('Page.setDownloadBehavior', {
              behavior: 'allow',
              downloadPath:
                __dirname +
                '/pdfs/' +
                presidentName.replace(/ /g, '').toLowerCase() +
                '/' +
                articleYear +
                '/',
            });

            await page.click('#content-core > p > a');
            await navigationPromise;
          } else if (await page.$('#content-core div')) {
            // in text html
            const presidentName = await page.evaluate(() => {
              return document.querySelector('#breadcrumbs-3 a').innerText;
            });
            const articleTitle = await page.evaluate(() => {
              return document.querySelector('#breadcrumbs-6') != null
                ? document.querySelector('#breadcrumbs-6').innerText
                : document.querySelector('#breadcrumbs-5').innerText;
            });
            const speechText = await page.evaluate(() => {
              return document.querySelector('#content-core div').innerText;
            });

            writeFile(`standardSpeeches/${_.camelCase(presidentName)}_${k}.txt`, speechText, cb);
          }
        } catch (err) {
          console.error(err ? 'deu ruim' : 'deu bom');
        }

        function cb(err) {
          console.error(err);
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
    }
  }

  await browser.close();
})();

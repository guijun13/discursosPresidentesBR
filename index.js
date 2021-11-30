const puppeteer = require('puppeteer');
const fs = require('fs');
const { info } = require('console');

(async () => {
  let getDirName = require('path').dirname;
  // const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: false });
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation({
    waitUntil: 'networkidle0',
  });

  // const url = `http://www.biblioteca.presidencia.gov.br/presidencia/ex-presidentes`;
  const url = `http://www.biblioteca.presidencia.gov.br/mapadosite`;
  await page.goto(url, { waitUntil: 'networkidle2' }).catch((e) => void 0);

  await navigationPromise;

  // await page.waitForSelector(
  //   '#portal-column-content #content .row .cell .tile-default .tile-content a'
  // );
  // await page.click('#portal-column-content #content .row .cell .tile-default .tile-content a');

  await page.waitForSelector(
    '#portal-sitemap > li:nth-child(10) > ul > li:nth-child(1) > ul > li > div'
  );

  await navigationPromise;
  // await page.click('#portal-sitemap > li:nth-child(10) > ul > li:nth-child(1) > ul > li > div > a');

  // await page.waitForSelector(
  //   'div > ul > li > span > span > span > span > span > span > span > span > span > span > span > span > a'
  // );
  // await page.click(
  //   'div > ul > li > span > span > span > span > span > span > span > span > span > span > span > span > a'
  // );

  // await page.waitForSelector('#content-core > article:nth-child(1) > div > h2 > a');
  // await page.click('#content-core > article:nth-child(1) > div > h2 > a');

  const linksList = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll(
      '#portal-sitemap > li:nth-child(10) > ul > li:nth-child(1) > ul > li > div'
    );
    items.forEach((item) => {
      results.push({
        url: item.children[0].href,
      });
    });
    return results;
  });

  // console.log(linksList);

  for (let i = 1; i < linksList.length; i++) {
    // for (let i = 1; i < 2; i++) {
    const link = linksList[i];
    await page.goto(`${link.url}`, { waitUntil: 'networkidle2' }).catch((e) => void 0);
    await navigationPromise;

    const discoursesResults = await page.evaluate(() => {
      const yearsLinks = [];
      if (document.querySelectorAll('#f0046f8a875947359dac10a807564bc3')) {
        // tem a parte de 'Discursos presidenciais'
        if (document.querySelector('#f84b41b10df14a67a7250c2b2bf06c07 > div > ul > li')) {
          // tem uma lista de anos
          const itens = document.querySelectorAll(
            '#f84b41b10df14a67a7250c2b2bf06c07 > div > ul > li a'
          );
          itens.forEach((i) => {
            if (
              i.href !=
                'https://editarcms.presidencia.gov.br/cobib_idg/presidencia/ex-presidentes/costa-silva/resolveuid/5fc9a0e0f68f426f835db4398fd78bfc' &&
              i.href !=
                'https://editarcms.presidencia.gov.br/cobib_idg/presidencia/ex-presidentes/costa-silva/resolveuid/ad9e5d2925084ab89070a5d67e60d285'
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
        }
      } else {
        return;
      }
    });

    let lenDiscoursesResults;
    if (discoursesResults) {
      if (discoursesResults.length > 1) {
        lenDiscoursesResults = discoursesResults.length;
      } else {
        lenDiscoursesResults = 1;
      }
    }

    await navigationPromise;

    for (let j = 0; j < lenDiscoursesResults; j++) {
      let link = discoursesResults[j];
      // if (link.url != null && link.url != undefined) {
      // console.log(`${link.url}`);
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
      // console.log('pagesToScrape:', pagesToScrape);

      await navigationPromise;

      let currentPage = 1;
      let urls = [];

      if (!pagesToScrape) {
        pagesToScrape = 1;
      }

      while (currentPage <= pagesToScrape) {
        let discourseList = await page.evaluate(() => {
          let discourseArticleList = [];
          let items = document.querySelectorAll('#content-core a.summary.url');
          items.forEach((item) => {
            discourseArticleList.push(item.href);
          });
          return discourseArticleList;
        });

        urls = urls.concat(discourseList);

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
        // console.log('currentPage:', currentPage);

        // console.table(urls);
        // console.dir(urls, { maxArrayLength: null });
      }
      // }
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
            await page._client.send('Page.setDownloadBehavior', {
              behavior: 'allow',
              downloadPath: downloadPath,
            });

            await page.click('#content-core > p > a');
            await navigationPromise;
          } else if (await page.$('#content-core div')) {
            // in text html
            const presidentName = await page.evaluate(() => {
              return document.querySelector('#breadcrumbs-3 a').innerText;
            });
            const articleTitle = await page.evaluate(() => {
              return document.querySelector('#breadcrumbs-6').innerText;
            });
            const speechText = await page.evaluate(() => {
              return document.querySelector('#content-core div').innerText;
            });

            writeFile(
              './speeches/' +
                presidentName.replace(/ /g, '').toLowerCase() +
                '/' +
                articleTitle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() +
                '_.txt',
              speechText,
              cb
            );
          }
        } catch (e) {}

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

  // await navigationPromise;

  await browser.close();
})();

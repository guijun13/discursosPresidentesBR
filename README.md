# Web Scraping: Brazilian presidents speeches

Web scraping project to collect all brazilian presidents speeches from [Biblioteca da presidência (ex-presidents)](http://www.biblioteca.presidencia.gov.br/presidencia/ex-presidentes/) and [Discursos do Planalto (actual president)](https://www.gov.br/planalto/pt-br/acompanhe-o-planalto/discursos) for further data analysis.

## Technologies:
* [Node.js](https://nodejs.org/)
* [Puppeteer](https://pptr.dev/)

## Pre requisites:
* Node.js 12+ version
* NPM 6+ version

## Usage:
* `git clone` the project
* Install all dependencies using `npm install`
* Run the main project using: `node index.js` for past presidents (before Bolsonaro)
  * They will have this folder pattern: pdfs/fernandocollor/1990/01.pdf
* Run the `bolsonaro.js` project (`node bolsonaro.js`) to collect all Bolsonaro speeches

### Optional:
* After running the main and bolsonaro files, approximately 80% of the data collected was pdf. Use the `pdf-to-txt.js` to extract the text data from the pdf file.
* Use the `rename-files.js` to rename the files to a certain pattern (such as cafeFilho10.txt, meaning the 11th (because starts with 0) Café Filho speech).

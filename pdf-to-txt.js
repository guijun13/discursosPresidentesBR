const fs = require('fs');
const PDFParser = require('pdf2json');
const crawler = require('crawler-request');
const pdf = require('pdf-parse');
const path = require('path');

let getDirName = require('path').dirname;

const moveFrom = __dirname + '/pdfs/';
const moveTo = __dirname + '/pdf-txt-teste/';

function cb(err) {
  console.error(err ? 'deu bom' : 'deu ruim');
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

(async () => {
  try {
    const presidentesFolder = await fs.promises.readdir(moveFrom);
    // console.log(presidentesFolder);
    for (const presidentes of presidentesFolder) {
      const yearsFolder = await fs.promises.readdir(moveFrom + `${presidentes}/`);
      // console.log(yearsFolder);
      for (const year of yearsFolder) {
        const data = await fs.promises.readdir(moveFrom + `${presidentes}/${year}/`);
        for (const file of data) {
          const fromPath = path.join(moveFrom + `${presidentes}/${year}/`, file);
          const toPath = path.join(moveTo + `${presidentes}/${year}/`, file);
          let dataBuffer = fs.readFileSync(fromPath);
          pdf(dataBuffer).then(function (data) {
            writeFile(toPath, data.text, cb);
          });
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
})();

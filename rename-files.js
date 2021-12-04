const fs = require('fs');
const path = require('path');

let getDirName = require('path').dirname;

// changing the name of files to nameSurname_index.txt
const oldPath = __dirname + '/pdf-txt-copia/fernandocollor/';

(async () => {
  try {
    const data = await fs.promises.readdir(oldPath);
    // for (const year of yearsFolder) {
    // const data = await fs.promises.readdir(`${oldPath}${year}/`);
    for (const [index, file] of data.entries()) {
      const fromPath = path.join(`${oldPath}`, file);
      fs.rename(fromPath, `${oldPath}fernandoCollor_${index}.txt`, () => {
        console.log('File Renamed!');
      });
    }
    // }
  } catch (e) {
    console.error(e);
  }
})();

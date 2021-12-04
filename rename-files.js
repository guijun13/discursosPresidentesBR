const fs = require('fs');
const path = require('path');

// changing the name of files to nameSurname_index.txt
const oldPath = __dirname + '/pdf-txt-copia/luizinácioluladasilva/';

// remove all files from 'year' folders, renaming them
(async () => {
  try {
    const yearsFolder = await fs.promises.readdir(oldPath);
    for (const year of yearsFolder) {
      const data = await fs.promises.readdir(`${oldPath}${year}/`);
      for (const [index, file] of data.entries()) {
        const fromPath = path.join(`${oldPath}/${year}/`, file);
        fs.rename(fromPath, `${oldPath}${Math.random(index)}_gou.txt`, (err) => {
          console.log(err == null ? 'deu bom 1' : `segunda func: ${err}`);
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
})();

//  rename all files to president name pattern
(async () => {
  try {
    const data = await fs.promises.readdir(`${oldPath}`);
    for (const [index, file] of data.entries()) {
      const fromPath = path.join(`${oldPath}`, file);
      fs.rename(fromPath, `${oldPath}luizInacioLula_${index}.txt`, (err) => {
        console.log(err == null ? 'deu bom 2' : `segunda func: ${err}`);
      });
    }
  } catch (e) {
    console.error(e);
  }
})();

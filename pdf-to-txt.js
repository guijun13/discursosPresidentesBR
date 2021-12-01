const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

let getDirName = require('path').dirname;

const moveFrom = __dirname + '/pdfs/';
const moveTo = __dirname + '/pdf-txt-teste/';

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

(async () => {
  try {
    const presidentesFolder = await fs.promises.readdir(moveFrom);
    for (const presidentes of presidentesFolder) {
      const yearsFolder = await fs.promises.readdir(moveFrom + `${presidentes}/`);
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

// have selected president name on 'moveFrom'
// (async () => {
//   try {
//     const yearsFolder = await fs.promises.readdir(moveFrom);
//     for (const year of yearsFolder) {
//       const data = await fs.promises.readdir(moveFrom + `${year}/`);
//       for (const file of data) {
//         const fromPath = path.join(moveFrom + `${year}/`, file);
//         const toPath = path.join(moveTo + `${year}/`, file);
//         let dataBuffer = fs.readFileSync(fromPath);
//         pdf(dataBuffer).then(function (data) {
//           writeFile(toPath, data.text, cb);
//         });
//       }
//     }
//   } catch (e) {
//     console.error(e);
//   }
// })();

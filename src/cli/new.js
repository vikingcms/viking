const fs = require('fs-extra');
const vikingNewFolder = require("global-modules-path").getPath("viking") + '/src/site/';
const process = require('process');

module.exports = {
    welcome() {
        console.log('Welcome to Viking');
    },
    createFolder(folderName) {
        console.log('creating new folder ' + folderName);
        fs.mkdir('./' + folderName , { recursive: true }, (err) => {
            if (err) throw err;
          });
    },
    newProject(folderName) {
        console.log('Welcome Viking!');
        console.log('Generating your new site inside ' + folderName + ' folder.');
        fs.mkdirSync('./' + folderName , { recursive: true });
        fs.copySync(vikingNewFolder, './' + folderName);

        process.chdir(process.cwd() + '/' + folderName);

        var serve = require(require("global-modules-path").getPath("viking") + '/src/cli/serve.js');

        console.log('Prepare your Hammer and Axe!')
        console.log('Because it\'s time to start building...');

        serve.launch();
        
    }
}

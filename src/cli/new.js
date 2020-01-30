const fs = require('fs-extra');

module.exports = {
    welcome: function(){
        console.log('Welcome to Viking');
    },
    createFolder: function(folderName){
        console.log('creating new folder ' + folderName);
        fs.mkdir('./' + folderName , { recursive: true }, (err) => {
            if (err) throw err;
          });
    },
    newProject: function(folderName){
        console.log('Welcome Viking!');
        console.log('Generating your new site inside: ' + folderName);
        fs.mkdir('./' + folderName , { recursive: true }, (err) => {
            if (err) throw err;
          });
        console.log('Prepare your Hammer and Axe!')
        console.log('Because it\'s time to start building...');
    }
}

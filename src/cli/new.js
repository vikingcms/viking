const fs = require('fs')

module.exports = {
    welcome: function(){
        console.log('Welcome to VikingCMS');
    },
    createFolder: function(folderName){
        console.log('creating new folder ' + folderName);
        fs.mkdir('./' + folderName , { recursive: true }, (err) => {
            if (err) throw err;
          });

        
    }
}

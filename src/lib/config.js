const fs = require('fs-extra');
let folder = require(require("global-modules-path").getPath("vikingcms") + '/src/lib/folder.js');

let self = module.exports = {
    
    loadConfigs: function(){

        return {
            build: self.loadConfig('build')
        }
    },

    loadConfig: function(name){

        try{
            return fs.readJsonSync( folder.config() + name + '.json');
        } catch (err){
            return {
                "debug" : false
            }
        }
    },

    updateOption(name, key, value){
        var data = {};
        data[key] = value;
        self.update(name, data);
    },

    update: function(name, data) {
        console.log('and data: ' + data);
        fs.outputJsonSync(folder.config() + name + '.json', data);
    }
}

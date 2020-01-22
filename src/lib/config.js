const fs = require('fs-extra');
let folder = require(require("global-modules-path").getPath("vikingcms") + '/src/lib/folder.js');

let self = module.exports = {
    
    loadConfigs: function(){

        return {
            build: self.loadConfig('build'),
            site: self.loadConfig('site')
        }
    },

    loadConfig: function(name){

        try{
            return fs.readJsonSync( folder.config() + name + '.json');
        } catch (err){
            let defaultConfig = fs.readJsonSync( folder.defaultConfigs() + name + '.json');
            fs.outputJsonSync(folder.config() + name + '.json', defaultConfig);
            return fs.readJsonSync( folder.config() + name + '.json');
        }
    },

    updateOption(name, key, value){
        

        try{
            data = fs.readJsonSync( folder.config() + name + '.json');
        } catch (err){
            var data = fs.readJsonSync( folder.defaultConfigs() + name + '.json');
        }

        data[key] = value;

        self.update(name, data);
    },

    update: function(name, data) {
        fs.outputJsonSync(folder.config() + name + '.json', data);
    }
}

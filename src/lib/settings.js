const fs = require('fs-extra');
let folder = require(require("global-modules-path").getPath("viking") + '/src/lib/folder.js');

let self = module.exports = {
    
    load: function(){

        return {
            build: self.loadSetting('build'),
            site: self.loadSetting('site'),
            environment: self.loadSetting('environment')
        }
    },

    loadSetting: function(name){

        try{
            return fs.readJsonSync( folder.settings() + name + '.json');
        } catch (err){
            let defaultSettings = fs.readJsonSync( folder.defaultSettings() + name + '.json');
            fs.outputJsonSync(folder.settings() + name + '.json', defaultSettings);
            return fs.readJsonSync( folder.settings() + name + '.json');
        }
    },

    updateOption(name, key, value){
        

        try{
            data = fs.readJsonSync( folder.settings() + name + '.json');
        } catch (err){
            var data = fs.readJsonSync( folder.defaultSettings() + name + '.json');
        }

        data[key] = value;

        self.update(name, data);
    },

    update: function(name, data) {
        fs.outputJsonSync(folder.settings() + name + '.json', data);
    }
}

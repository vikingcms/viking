const fs = require('fs-extra');
const folder = require(require("global-modules-path").getPath("viking") + '/src/lib/folder.js');

const self = module.exports = {
    
    load() {

        return {
            site: self.loadSetting('site'),
            environment: self.loadSetting('environment')
        }
    },

    loadSetting(name) {

        try{
            return fs.readJsonSync( folder.settings() + name + '.json');
            console.log('reading settings from ' + folder.settings());
        } catch (err){
            let defaultSettings = fs.readJsonSync( folder.defaultSettings() + name + '.json');
            fs.outputJsonSync(folder.settings() + name + '.json', defaultSettings);
            return fs.readJsonSync( folder.settings() + name + '.json');
        }
    },

    updateOption(name, key, value) {
        
        try{
            data = fs.readJsonSync( folder.settings() + name + '.json');
        } catch (err){
            var data = fs.readJsonSync( folder.defaultSettings() + name + '.json');
        }

        data[key] = value;

        self.update(name, data);
    },

    update(name, data) {
        fs.outputJsonSync(folder.settings() + name + '.json', data);
    }
}

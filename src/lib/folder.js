/**
 * ----------------------------------------------------------------------
 * Folder Locations
 * ----------------------------------------------------------------------
 * The folder directories and paths needed for Viking CMS, use as follows:
 * 
 * folder.root()        Root directory of the current project (ex. './')
 * folder.rootPath()    Root path to the current project (ex. '/Users/John/sites/website/')
 * folder.content()     Content directory
 * folder.contentPath() Content path
 * folder.image()       Image directory
 * folder.imagePath()   Image path
 * folder.post()        Post directory
 * folder.postPath()    Post path
 * folder.theme()       Theme directory
 * folder.themePath()   Theme path
 * folder.site()        Site directory
 * folder.sitePath()    Site path
 * folder.vikingPath()  Viking path
 * folder.defaultSettings() Viking default settings location
 */

const contentFolder = 'content/';
const imageFolder = 'images/';
const postFolder = 'posts/json/';
const siteFolder = 'site/';
const themeFolder = 'themes/';
const settingsFolder = 'settings/';


const folder = module.exports = {
    root: function(){
        return './';
    },
    rootPath: function(){
        return process.cwd() + '/';
    },
    content: function(){
        return folder.root() + contentFolder;
    },
    contentPath: function(){
        return folder.rootPath() + contentFolder;
    },
    image: function(){
        return folder.content() + imageFolder;
    },
    imagePath: function(){
        return folder.contentPath() + imageFolder;
    },
    post: function(){
        return folder.content() + postFolder;
    },
    postPath: function(){
        return folder.contentPath() + postFolder;
    },
    theme: function(){
        return folder.content() + themeFolder;
    },
    themePath: function(){
        return folder.contentPath() + themeFolder;
    },
    site: function(){
        return folder.root() + siteFolder;
    },
    sitePath: function(){
        return folder.rootPath() + siteFolder;
    },
    settings: function(){
        return folder.root() + settingsFolder;
    },
    settingsPath: function(){
        return folder.rootPath() + settingsFolder;
    },
    vikingPath: function(){
        return require("global-modules-path").getPath("viking") + '/';
    },
    defaultSettings: function(){
        return folder.vikingPath() + 'src/site/settings/';
    }
}
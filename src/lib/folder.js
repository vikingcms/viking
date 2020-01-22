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
 * folder.vikingPath()  VikingCMS path
 * folder.defaultConfigs() VikingCMS default config location
 */

let contentFolder = 'content/';
let imageFolder = 'images/';
let postFolder = 'posts/json/';
let siteFolder = 'site/';
let themeFolder = 'themes/';
let configFolder = 'config/';


let folder = module.exports = {
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
    config: function(){
        return folder.root() + configFolder;
    },
    configPath: function(){
        return folder.rootPath() + configFolder;
    },
    vikingPath: function(){
        return require("global-modules-path").getPath("vikingcms") + '/';
    },
    defaultConfigs: function(){
        return folder.vikingPath() + 'src/config/';
    }
}
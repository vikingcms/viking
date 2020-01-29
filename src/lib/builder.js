var path = require('path');
const fs = require('fs-extra');
// In newer Node.js versions where process is already global this isn't necessary.
var process = require("process");
var slugify = require('slugify');
let dateFormat = require('dateformat');
let themeFolder = '/content/themes/';
let sizeOf = require('image-size');

let folder = require(require("global-modules-path").getPath("vikingcms") + '/src/lib/folder.js');
const settings = require(folder.vikingPath() + '/src/lib/settings.js');
const Post = require(folder.vikingPath() + 'src/lib/post.js');

let post = new Post();
let themePath = folder.themePath() + '2020/';
let siteMapContents = '';

let onlyOnce = false;

let builder = module.exports = {
    build: function(){
        
        let buildSettings = settings.load().build;
        let siteSettings = settings.load().site;
        let posts = post.orderBy('created_at', 'DESC').getPosts();

        // empty the site folder
        fs.emptyDirSync( folder.sitePath() );

        
        fs.readdir(themePath, function (err, files) {
            if (err) {
              console.error("Could not list the directory.", err);
              process.exit(1);
            }
          
            files.forEach(function (file, index) {

                if(index == 0){
                    builder.beginSitemap();
                }

                let extension = path.extname(file);
                if(typeof(extension) != 'undefined' && extension == '.axe'){

                    // if debug mode is on we will write all posts to a json file
                    if(buildSettings.debug){
                        fs.writeJsonSync( folder.sitePath() + '/posts.json', posts, { spaces: '\t' });
                    }

                    if(file == 'home.axe'){
                        builder.writeFile(file, '', {});
                    }
                    
                    if(file == 'single.axe'){

                        posts.forEach(function (post, index) {
                            builder.writeFile(file, post.slug + '/', { post: post });
                        });

                    }

                    if(file == 'amp.axe'){

                        posts.forEach(function (post, index) {
                            builder.writeFile(file, '/amp/' + post.slug + '/', { post: post });
                        });

                    }

                    if(file == 'loop.axe'){
                        builder.writeFile(file, siteSettings.loopRoute + '/', {});
                    }

                    // copy over all the assets
                    fs.copySync(themePath + '/site/', folder.sitePath());
                    // copy over all the images
                    fs.copySync(folder.imagePath(), folder.sitePath() + 'images/');

                    console.log('op ind: ' + index);
                    

                }
                
            });
            builder.endSitemap();
            builder.createCNAME();
        });

        

        return {'status' : 'success'};
    },

    writeFile: function(file, directory, data){

        let buildSettings = settings.load().build;
        let siteSettings = settings.load().site;
        builder.addToSitemap(file, directory, data, siteSettings);

        let contents = '';
        // turn into func used again below
        builder.replaceIncludes(file, function(contents){
            
            builder.replaceConditionals(contents, data, function(contents){
                contents = builder.replaceTitle( contents, file, data );
                if(file == 'single.axe' || file == 'amp.axe'){
                    let amp = (file == 'amp.axe') ? true : false;
                    contents = builder.replacePostData( contents, data.post, amp);
                }
                if(file == 'loop.axe'){
                    contents = builder.replacePostDataLoop( contents );
                }
                if(buildSettings.debug){
                    contents = builder.addAdminBar(contents);
                }

                fs.outputFileSync(folder.sitePath() + directory + 'index.html', contents);
                console.log('Built: ' + file);
            });
        });

        

        
    },

    beginSitemap: function(){
        siteMapContents = `<?xml version="1.0" encoding="UTF-8" ?>\n\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    },

    endSitemap: function(){
        siteMapContents += `\n\n</urlset>`;
        fs.writeFileSync(folder.sitePath() + 'sitemap.xml', siteMapContents);
    },

    addToSitemap: function(file, directory, data, siteSettings){

        let urlStructure = `\n\t<url>\n\t\t<loc>{{ loc }}</loc>\n\t\t<lastmod>{{ lastmod }}</lastmod>\n\t\t<priority>{{ priority }}</priority>\n\t</url>`;

        //Check which file this is for
        if(file == 'home.axe'){
            urlStructure = urlStructure.replace('{{ loc }}', siteSettings.url);
            urlStructure = urlStructure.replace('{{ lastmod }}', dateFormat(new Date(), "isoDateTime"));
            urlStructure = urlStructure.replace('{{ priority }}', '1.0');
        }

        if(file == 'loop.axe'){
            urlStructure = urlStructure.replace('{{ loc }}', siteSettings.url + '/' + directory);
            urlStructure = urlStructure.replace('{{ lastmod }}', dateFormat(new Date(), "isoDateTime"));
            urlStructure = urlStructure.replace('{{ priority }}', '0.9');
        }

        if(file == 'single.axe'){
            urlStructure = urlStructure.replace('{{ loc }}', siteSettings.url + '/' + directory);
            urlStructure = urlStructure.replace('{{ lastmod }}', dateFormat(new Date(data.post.updated_at), "isoDateTime"));
            urlStructure = urlStructure.replace('{{ priority }}', '0.9');
        }

        siteMapContents += urlStructure;
        
    },

    getPost: function(file){
        return fs.readFileSync(file, 'utf8');
    },

    replaceConditionals(contents, data, _callback){
        let conditionalTxt = '@if(';
        let endContiditionalTxt = '@endif';

        let startIndex = contents.indexOf(conditionalTxt);
        if(startIndex > 0){

            let post = data.post;
            

            let endConditional = contents.indexOf(')', startIndex);
            let conditional = contents.substring(startIndex + conditionalTxt.length, endConditional);
            
            let BeginningOfEnd = contents.indexOf(endContiditionalTxt);


           let conditionalResult = false;
           eval('if( ' + conditional + '){ conditionalResult = true; }');

           let firstHalfOfContent = contents.slice(0, startIndex);
            try{
                // if it's try we only want to remove the conditional @if and leave the content inside
                if(conditionalResult){
                    // remove the @if() section
                    firstHalfOfContent = contents.slice(0, startIndex) + contents.slice(endConditional+1, BeginningOfEnd);
                }
            } catch (err){
                    firstHalfOfContent = contents.slice(0, startIndex);
            }
            let secondHalf = contents.slice(BeginningOfEnd + endContiditionalTxt.length, contents.length);
            contents = firstHalfOfContent + secondHalf;

            if(!onlyOnce){
                onlyOnce = true;
                console.log('end is: ' + BeginningOfEnd + ' and statement is ' + conditional);
            }
        }

        let nextConditional = contents.indexOf(conditionalTxt);
        if(nextConditional > 0){
            builder.replaceConditionals(contents, data, _callback);
        } else {
            _callback(contents);
        }
    },

    replaceIncludes: function(file, _callback){
        let contents = fs.readFileSync(themePath + file, 'utf8');
        let include = contents.indexOf('@include', 0);

        while(include != -1){
            let endInclude = builder.endOfIncludeLocation(include, contents.substring(include, contents.length));
            let includeText = contents.substring(include, include+endInclude);
            let includeTemplate = includeText.split(" ");
            if(typeof(includeTemplate[1]) !== "undefined"){
                let allowedFileIncludes = ['.css', '.js', '.axe'];
                let partial = includeTemplate[1];
                let fileExt = path.extname(partial);
                if(fileExt == '.css'){
                    console.log('heyo partial: ' + partial);
                    console.log('----');
                    if(allowedFileIncludes.includes( fileExt )){
                        console.log('and it be true The Pen is Blue');
                    }
                }
                if(allowedFileIncludes.includes( fileExt )){
                    // remove the extension
                    partial = partial.split('.').slice(0, -1).join('.');
                } else {
                    fileExt = '.axe';
                }
                includeTemplate = partial.replace(/\./g, '/') + fileExt;
                // fetch file contents and replace the template
                contents = contents.replace( includeText, fs.readFileSync( themePath + includeTemplate, 'utf8' ) );
            }
            include = contents.indexOf('@include', include+1);
        }

        _callback( contents );
    },
    replaceSettings: function(contents){
        //let loadSettings = builder.loadSettingsFile();
        let settings = {
                "title": ""
            };

        contents = contents.replace('{{ title }}', settings.title);

        return contents;
    },
    replaceTitle: function(contents, file, data){
        //let loadSettings = builder.loadSettingsFile();
        let settings = {
            "title": "Get Full Report",
            "description": "Background Checks, Phone Lookups, and People Search"
        };

        if(file == 'home.axe'){
            contents = contents.replace('{{ title }}', settings.title + ' - ' + settings.description);
        }

        if(file == 'loop.axe'){
            contents = contents.replace('{{ title }}', 'Background Check Guides - ' + settings.title);
        }

        if(file == 'single.axe'){
            contents = contents.replace('{{ title }}', data.post.title + ' - ' + settings.title);
        }

        return contents;
    },
    endOfIncludeLocation: function(start, str){
        let endIncludeLocation = str.length;
        let nextSpaceIndex = str.indexOf(" ", 10);
        let nextNewLineIndex = str.indexOf("\n", 10);
        if(nextSpaceIndex != -1 && nextSpaceIndex <= nextNewLineIndex){
            endIncludeLocation = nextSpaceIndex;
        }
        if(nextNewLineIndex != -1 && nextNewLineIndex <= nextSpaceIndex){
            endIncludeLocation = nextNewLineIndex;
        }
        return endIncludeLocation;
    },
    replacePostData: function( contents, post, amp ){
        if(typeof amp == 'undefined'){
            amp = false;
        }
        for (var key in post) {
            if (post.hasOwnProperty(key)) {
                
                if(key == 'meta'){
                    for(meta_key in post.meta){
                        if (post.meta.hasOwnProperty(meta_key)) {
                            let replaceThis = '{{ post.meta.' + meta_key + ' }}';
                            let withThis = post.meta[meta_key];
                            
                            let regexReplaceThis = new RegExp(replaceThis, 'g');
                            contents = contents.replace(regexReplaceThis, withThis);
                        }
                    }
                } else {
                    let replaceThis = '{{ post.' + key + ' }}';
                    let withThis = post[key];
                    if(key == 'body'){
                        withThis = (amp) ? builder.renderAmp(post[key]) : builder.renderHTML(post[key]);
                    }
                    if(key == 'created_at'){
                        withThis = dateFormat( post[key], "mmmm d, yyyy");
                    }
                    let regexReplaceThis = new RegExp(replaceThis, 'g');
                    contents = contents.replace(regexReplaceThis, withThis);
                }
            }
        }
        return contents;
    },
    replacePostDataLoop: function(contents){
        let posts = post.orderBy('created_at', 'DESC').getPosts();
        
        let loopStartString = '@loop';
        let loopEndString = '@endloop';

        let loopStart = contents.indexOf( loopStartString );
        let loopEnd = contents.indexOf( loopEndString );

        let topHTML = contents.slice(0, loopStart);
        let loopHTML = contents.slice( loopStart + loopStartString.length, loopEnd );
        let bottomHTML = contents.slice(loopEnd + loopEndString.length, contents.length);

        let loopContent = '';

        posts.forEach(function (post, index){
            loopContent += builder.replacePostData( loopHTML, post );
        });

        // insert loop content between top and bottom half of file
        contents = topHTML + loopContent.trim() + bottomHTML;

        // return updated contents
        return contents;

        // posts.forEach(function (post, index) {

        // });
    },
    renderHTML: function(data) {
        let result = ``;
        for (let block of data.blocks) {
          switch (block.type) {
            case 'paragraph':
              result += `<p>${block.data.text}</p>`;
              break;
            case 'header':
              result += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
              if(block.data.level == 2){
                  result = result.replace('<h2>', '<h2 id="' + slugify(block.data.text, { remove: /[^\w\s]/gi, lower:true}) + '">');
              }
              break;
            case 'list':
                if(block.data.style == 'ordered'){
                    result += `<ol>`;
                } else {
                    result += `<ul>`;
                }
                for(var i=0; i<block.data.items.length; i++){
                    result += `<li>` + block.data.items[i] + `</li>`;
                }
                if(block.data.style == 'ordered'){
                    result += `</ol>`;
                } else {
                    result += `</ul>`;
                }
              break;
            case 'image':
                result += `<img src="${block.data.file.url}" class="w-full">`;
                break;
          }
        }
        return result;
    },
    renderAmp: function(data) {
        let result = ``;
        for (let block of data.blocks) {
          switch (block.type) {
            case 'paragraph':
              result += `<p>${block.data.text}</p>`;
              break;
            case 'header':
              result += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
              if(block.data.level == 2){
                  result = result.replace('<h2>', '<h2 id="' + slugify(block.data.text, { remove: /[^\w\s]/gi, lower:true}) + '">');
              }
              break;
            case 'list':
                if(block.data.style == 'ordered'){
                    result += `<ol>`;
                } else {
                    result += `<ul>`;
                }
                for(var i=0; i<block.data.items.length; i++){
                    result += `<li>` + block.data.items[i] + `</li>`;
                }
                if(block.data.style == 'ordered'){
                    result += `</ol>`;
                } else {
                    result += `</ul>`;
                }
              break;
            case 'image':
                    let imagePath = folder.contentPath() + block.data.file.url;
                    if (fs.existsSync(imagePath)) {
                        var size = sizeOf(folder.contentPath() + block.data.file.url);
                        result += `<amp-img layout="responsive" src="${block.data.file.url}" width="${size.width}" height="${size.height}"></amp-img>`;
                    }
                
                break;
          }
        }
        return result;
    },
    createCNAME: function(){
        let siteSettings = settings.load().site;
        let domain = siteSettings.url.replace('https://', '').replace('http://', '');
        fs.outputFileSync(folder.sitePath() + 'CNAME', domain);
    },
    addAdminBar: function(contents) {
        return contents.replace('</body>', builder.adminBarHTML() + '</body>');
    },
    adminBarHTML: function() {
        return `<div style="background-color: #000; z-index: 50; width: 100%; left: 0; bottom:0; position: fixed; height: 2.5rem; -webkit-box-pack: justify; justify-content: space-between; -webkit-box-align: center; align-items: center; display: -webkit-box; display: flex; box-sizing: border-box; border-width:0px;">
                    <img src="/dashboard/assets/img/logo-inverse.svg" style="width: auto; padding-left: 0.5rem; height: 1rem;">
                    <div style="display: -webkit-box; display: flex; height: 2.5rem;">
                        <a href="/dashboard" style="text-transform: uppercase; font-size: 0.75rem; color: #fff; padding-left: 0.75rem; padding-right: 0.75rem; height: 100%; font-weight: 500; -webkit-box-align: center; align-items: center; display: -webkit-box; display: flex; border-left-width: 1px; border-right-width: 1px; border-color: #2d3748;">Dashboard</a>
                    </div>
                </div>`;
    }
};
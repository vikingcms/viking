import EditorJS from '@editorjs/editorjs';
const Header = require('@editorjs/header');
const LinkTool = require('@editorjs/link');
const RawTool = require('@editorjs/raw');
import ImageTool from '@editorjs/image';
const List = require('@editorjs/list');
const Delimiter = require('@editorjs/delimiter');
const Quote = require('@editorjs/quote');
const Warning = require('@editorjs/warning');
const InlineCode = require('@editorjs/inline-code');
const axios = require('axios');
import ace from 'ace-builds';
import modeJson from 'ace-builds/src-min-noconflict/mode-json.js';
import themeChrome from 'ace-builds/src-min-noconflict/theme-chrome.js';
var slugify = require('slugify');
let createPost = null;
setCreatePostFalse();

if(document.getElementById('createPost') && parseInt(document.getElementById('createPost').value)){
    setCreatePostTrue();
}

async function getb6(file){
    return await (new Response(file)).text();
}

let meta_schema = '';
if( document.getElementById('meta_schema') ){
    //ace.config.setModuleUrl('ace/mode/json_worker', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.7/worker-javascript.js');
    //ace.config.set("workerPath", 'ace-builds/src-min-noconflict/worker-json.js');
    //ace.config.setModuleUrl('ace/mode/json_worker', require('file-loader!../../../node_modules/ace-builds/src-min-noconflict/worker-json.js'));
    meta_schema = ace.edit('meta_schema', {
        mode: 'ace/mode/json',
        selectionStyle: 'text',
        showPrintMargin: false,
        theme: 'ace/theme/chrome'
    });
    meta_schema.getSession().setUseWorker(false);
    
}

let editor = '';
if( document.getElementById('editor') ){
    editor = new EditorJS({
    /**
     * Id of Element that should contain Editor instance
     */
    holderId: 'editor',
    tools: {
        header: Header,
        linkTool: {
            class: LinkTool,
            config: {
                endpoint: 'http://localhost:8008/fetchUrl', // Your backend endpoint for url data fetching
            }
        },
        raw: RawTool,
        image: {
            class: ImageTool,
            config: {
                endpoints: {
                    byFile: '/dashboard/uploadFile', // Your backend file uploader endpoint
                    byUrl: 'http://localhost:8008/fetchUrl', // Your endpoint that provides uploading by Url
                }
            }
        },
        paragraph: {
            config: {
                placeholder: 'Tell your story...'
            }
        },
        list: {
            class: List,
            inlineToolbar: true,
        },
        delimiter: Delimiter,
        inlineCode: {
            class: InlineCode,
            shortcut: 'CMD+SHIFT+M',
        },
        warning: Warning,
        quote: Quote
    },
    autofocus: !createPost,
    onReady: () => {
        console.log('rdy');
        renderBlocks();
    }
    });
}

function renderBlocks(){
    //if( document.getElementById('editor').dataset.blocks ){
        let blocks = {};
        if( document.getElementById('editor').dataset.blocks ){
            blocks = JSON.parse(document.getElementById('editor').dataset.blocks);
        }
        console.log(blocks + ' -');
        if(blocks && editor){
            editor.blocks.render(
                blocks
            );
        }
    //}
}

if( document.getElementById('settings') ){

    document.getElementById('settings-open').addEventListener('click', function(){
        document.getElementById('settings').classList.add('open');
        
        setTimeout(function(){
            document.getElementById('settings-sidebar').classList.add('open');
        }, 10);
    });

    document.getElementById('settings-backdrop').addEventListener('click', function(){
        closeSettingsBar();
    });

    document.getElementById('settings-close').addEventListener('click', function(){
        closeSettingsBar();
    });

}

var openToggles = document.getElementsByClassName('open-toggle');
for(var i = 0; i < openToggles.length; i++){
    openToggles[i].addEventListener('click', function(){
        let toggleId = this.dataset.toggle;
        let toggleElement = document.getElementById( toggleId );
        if(toggleElement.classList.contains('open')){
            toggleElement.classList.remove('open');
        } else {
            toggleElement.classList.add('open');
        }
    });
}

window.removeOpenClasses =  function(){
    var openClasses = document.getElementsByClassName('open');
    for(var i = 0; i < openClasses.length; i++){
        if(openClasses[i].id != 'settings'){
            openClasses[i].classList.remove('open');
        }
    }
}

if( document.getElementById('save-post') ){
    document.getElementById('save-post').addEventListener('click', function(){
        savePost();
    });
}

if( document.getElementById('delete-post') ){
    document.getElementById('delete-post').addEventListener('click', function(){
        getPostData(function(data){
            axios.post('/dashboard/posts/delete', {
                slug: data.slug
            })
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    window.location = '/dashboard/posts';
                }

                if(data.status == "fail"){
                    showNotification('danger', JSON.stringify(data.message) )
                }
            })
            .catch(function (error) {
                console.log(error);
            });
        });
    });
}

function closeSettingsBar(){
    document.getElementById('settings-sidebar').classList.remove('open');
    removeOpenClasses();
    setTimeout(function(){
        document.getElementById('settings').classList.remove('open');
    }, 300);
}

function savePost(){
   
    getPostData(function(data){
        axios.post('/dashboard/posts/create', data)
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    window.history.pushState({}, title, '/dashboard/post/' + data.slug);
                    document.getElementById('slug').value = data.slug;
                    setCreatePostFalse();
                    showNotification('success', 'Your new post has been successfull created.');
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    });

        
}

function getSlugValue(){
    let slug = document.getElementById('slug').value;
    if( slug == "" ){
        // return a slugified version of the title
        slug = slugify( document.getElementById('title').value );
    }

    // otherwise return the slug value since it is not empty
    return slug.toLowerCase();
}

function setCreatePostTrue(){
    document.getElementById('title').focus();
    createPost = true;
    document.getElementById('delete-post').classList.add('hidden');
}

function setCreatePostFalse(){
    createPost = false;
    if( document.getElementById('delete-post') ){
        document.getElementById('delete-post').classList.remove('hidden');
    }
}

if( document.getElementById('title') ){
    document.getElementById('title').addEventListener('keydown', function(evt){
        // if(evt.keyCode){
        //     document.getElementById('editor').click();
        // }
    });
}

function getPostData(_callback){
    
    editor.save().then((body) => {
        _callback({
            title: document.getElementById('title').value,
            body: body,
            image: document.getElementById('image').src,
            image_filename: document.getElementById('image').dataset.name,
            slug: getSlugValue(),
            excerpt: document.getElementById('excerpt').value,
            meta_title: document.getElementById('meta_title').value,
            meta_description: document.getElementById('meta_description').value,
            meta_schema: meta_schema.getValue()
        });

    }).catch((error) => {
      console.log('Saving failed: ', error);
      _callback({});
    });
    
}

window.showNotification = function(type, message){
    createNotification(type, message);
    
    setTimeout(function(){
        let notification = document.getElementById('notification');
        if( notification ){
            notification.classList.add('open');
        }
    }, 10);
}

if( document.getElementById('toggleDebug') ){
    document.getElementById('toggleDebug').addEventListener('change', function(){
        updateConfig(this.dataset.config, this.dataset.key, ( (this.checked) ? true: false ) );
    });
}

function updateConfig(file, key, value){
    axios.post('/dashboard/update/config/' + file, { key: key, value: value })
    .then(function (response) {
        console.log(response);
    })
    .catch(function (error) {
        console.log(error);
    });
}

let notificationTemplate = function(type, message, title, color){
    return `<div class="fixed bottom-0 shadow-2xl group rounded-t-lg bg-white border border-gray-100 cursor-pointer transition ` + type + `" id="notification">
        <div class="float-left w-24">
            <div class="rounded-full absolute left-0 bg-black bg-gray-100 border-` + color + `-400 border-l-4 border-b-4 bubble"></div>
            <img src="/dashboard/assets/img/notifications/` + type + `.png" class="h-48 -ml-8 -mt-8 relative">
        </div>
        <div class="flex flex-col justify-center h-full pl-4 pr-5">
            <h4 class="text-` + color + `-400 font-bold -mt-1 mb-1">` + title + `</h4>
            <p class="text-xs text-gray-500 overflow-scroll">` + message + `</p>
        </div>
        <div class="absolute right-0 top-0 bg-gray-100 group-hover:bg-gray-200 text-gray-400 rounded-full h-5 w-5 flex justify-center items-center text-xs leading-none font-bold mt-2 mr-2 cursor-pointer">&times;</div>
    </div>`;
}

let createNotification = function(type, message){
    let title = 'Notice';
    let color = 'gray';
    if(type == 'success'){
        title = 'Victory!';
        color = 'green';
    } else if(type == 'danger'){
        title = 'Dagummit!'
        color = 'red';
    } else if(type == 'info'){
        title = 'Goodaye!'
        color = 'indigo';
    } else if(type == 'warning'){
        title = 'Be Warned!'
        color = 'orange';
    }
    let dynamicElement = document.createElement('div');
    dynamicElement.innerHTML = notificationTemplate(type, message, title, color);
    document.body.appendChild(dynamicElement);
    document.getElementById('notification').addEventListener('click', function(){
        document.getElementById('notification').classList.remove('open');
        setTimeout(function(){
            document.getElementById('notification').remove();
        }, 300);
    });
    setTimeout(function(){
        if( document.getElementById('notification') ){
            document.getElementById('notification').classList.remove('open');
            setTimeout(function(){
                if( document.getElementById('notification') ){ document.getElementById('notification').remove(); }
            }, 300);
        }
    }, 3000);
}


// Add event listener click for the build button
if( document.getElementById('build-btn') ){
    document.getElementById('build-btn').addEventListener('click', function(){
        axios.post('/dashboard/build')
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    showNotification('success', 'Successfully built your site.');
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    });
}

//showNotification('success', 'Your new post has been successfull created.');
//showNotification('danger', 'Something has went wrong trying to save your post.');
//showNotification('info', 'Did you know that you can upload an image for your post.');
//showNotification('warning', 'Make sure to enter a good title in your post.');

window.encodeImageFileAsURL = function(element) {
    var file = element.files[0];
    var reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('image').src = event.target.result;
        document.getElementById('image').dataset.name = file.name;
        console.log('hit abcdefg');
    }
    reader.readAsDataURL(file);
}

if(document.getElementById('image_upload')){
    document.getElementById('image_upload').addEventListener('change', function(event){
        console.log('changed y');
        encodeImageFileAsURL(this);
        showImagePreview();
    });
}

window.hideImagePreview = function(){
    document.getElementById('image_preview_upload').classList.remove('hidden');
    document.getElementById('image_upload').classList.remove('hidden');
    document.getElementById('image_preview').classList.add('hidden');
    document.getElementById('image').src = document.getElementById('image').dataset.pixel;
    document.getElementById('image_upload').value = "";
    document.getElementById('image').dataset.name = "";
}

window.showImagePreview = function(){
    document.getElementById('image_preview_upload').classList.add('hidden');
    document.getElementById('image_upload').classList.add('hidden');
    document.getElementById('image_preview').classList.remove('hidden');
}


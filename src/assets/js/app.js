import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import LinkTool from '@editorjs/link';
import RawTool from '@editorjs/raw';
import ImageTool from '@editorjs/image';
import List from '@editorjs/list';
import Delimiter from '@editorjs/delimiter';
import Quote from '@editorjs/quote';
import Warning from '@editorjs/warning';
import InlineCode from '@editorjs/inline-code';
import axios from 'axios';
import ace from 'ace-builds';
import modeJson from 'ace-builds/src-min-noconflict/mode-json.js';
import themeChrome from 'ace-builds/src-min-noconflict/theme-chrome.js';
import slugify from 'slugify';
import helper from './helper';

let createPost = null;
setCreatePostFalse();

if(document.getElementById('createPost') && parseInt(document.getElementById('createPost').value)){
    setCreatePostTrue();
}

let meta_schema = '';
if( document.getElementById('meta_schema') ){
    meta_schema = ace.edit('meta_schema', {
        mode: 'ace/mode/json',
        selectionStyle: 'text',
        showPrintMargin: false,
        theme: 'ace/theme/chrome'
    });
    meta_schema.getSession().setUseWorker(false);
    
}

let meta_data = '';
if( document.getElementById('meta_data') ){
    meta_data = ace.edit('meta_data', {
        mode: 'ace/mode/json',
        selectionStyle: 'text',
        showPrintMargin: false,
        theme: 'ace/theme/chrome'
    });
    meta_data.getSession().setUseWorker(false);
    
}

window.editor = '';
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
        if(document.getElementById('editor').dataset.blocks){
            helper.renderBlocks();
        }
    }
    });
}

if( document.getElementById('settings') ){

    document.getElementById('settings-open').addEventListener('click', function(){
        document.getElementById('settings').classList.add('open');
        
        setTimeout(function(){
            document.getElementById('settings-sidebar').classList.add('open');
        }, 10);
    });

    document.getElementById('settings-backdrop').addEventListener('click', function(){
        helper.closeSettingsBar();
    });

    document.getElementById('settings-close').addEventListener('click', function(){
        helper.closeSettingsBar();
    });

}

let openToggles = document.getElementsByClassName('open-toggle');
for(let i = 0; i < openToggles.length; i++){
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

if( document.getElementById('save-post') ){
    document.getElementById('save-post').addEventListener('click', function(){
        helper.savePost();
    });
}

if( document.getElementById('delete-post') ){
    document.getElementById('delete-post').addEventListener('click', function(){
        helper.getPostData(function(data){
            axios.post('/dashboard/posts/delete', {
                slug: data.slug
            })
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    window.location = '/dashboard/posts';
                }

                if(data.status == "fail"){
                    helper.showNotification('danger', JSON.stringify(data.message) )
                }
            })
            .catch(function (error) {
                console.log(error);
            });
        });
    });
}

if ( document.getElementById('title') ){
    document.getElementById('title').addEventListener('keydown', function(evt){
        // if(evt.keyCode){
        //     document.getElementById('editor').click();
        // }
    });
}

if( document.getElementById('toggleDebug') ){
    document.getElementById('toggleDebug').addEventListener('change', function(){
        helper.updateSettings(this.dataset.settings, this.dataset.key, ( (this.checked) ? true: false ) );
    });
}

// Add event listener click for the build button
if( document.getElementById('build-btn') ){
    document.getElementById('build-btn').addEventListener('click', function(){
        axios.post('/dashboard/build')
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    helper.showNotification('success', 'Successfully built your site.');
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    });
}

// Uncomment each notification below to see an example of each one
//helper.showNotification('success', 'Your new post has been successfull created.');
//helper.showNotification('danger', 'Something has went wrong trying to save your post.');
//helper.showNotification('info', 'Did you know that you can upload an image for your post.');
//helper.showNotification('warning', 'Make sure to enter a good title in your post.');

if (document.getElementById('image_upload')) {
    document.getElementById('image_upload').addEventListener('change', function (event) {
        helper.encodeImageFileAsURL(this);
        showImagePreview();
    });
}

// these two functions are invoked in template files
// it might be necessary to attach them to the window object
// do not move to helper.js
window.hideImagePreview = function() {
    document.getElementById('image_preview_upload').classList.remove('hidden');
    document.getElementById('image_upload').classList.remove('hidden');
    document.getElementById('image_preview').classList.add('hidden');
    document.getElementById('image').src = document.getElementById('image').dataset.pixel;
    document.getElementById('image_upload').value = "";
    document.getElementById('image').dataset.name = "";
}

window.showImagePreview = function() {
    document.getElementById('image_preview_upload').classList.add('hidden');
    document.getElementById('image_upload').classList.add('hidden');
    document.getElementById('image_preview').classList.remove('hidden');
}

let secondTick = false;

// this function relies on the "secondTick" flag, set above
// do not move to helper.js
function DisplayCurrentTime() {
    let date = new Date();
    let hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
    let am_pm = date.getHours() >= 12 ? "PM" : "AM";
    let minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    let secondDelimiter = (secondTick) ? '<span class="text-gray-700">:</span>' : ':';
    secondTick = !secondTick;
    document.getElementById('time').innerHTML = hours + secondDelimiter + minutes + " " + am_pm;
    let time = setTimeout(DisplayCurrentTime, 500);
};

function DisplayCurrentDate() {
    let now = new Date();
    let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let dayOfWeek = days[ now.getDay() ];
    let month = months[ now.getMonth() ];
    let day = now.getDate();
    let year = now.getFullYear();
    document.getElementById('date').innerHTML = dayOfWeek + ", " + month + " " + day + helper.nth(day) + " " + year;
    let time = setTimeout(DisplayCurrentDate, 500);
}

// these two functions rely on the "createPost" flag, set above
// do not move to helper.js
function setCreatePostTrue() {
    document.getElementById('title').focus();
    createPost = true;
    document.getElementById('delete-post').classList.add('hidden');
}

function setCreatePostFalse() {
    createPost = false;
    if( document.getElementById('delete-post') ){
        document.getElementById('delete-post').classList.remove('hidden');
    }
}

if( document.getElementById('time') ) {
    DisplayCurrentTime();
}

if( document.getElementById('date') ) {
    DisplayCurrentDate();
}


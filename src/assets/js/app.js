import EditorJS from '@editorjs/editorjs';
const Header = require('@editorjs/header');
const LinkTool = require('@editorjs/link');
const RawTool = require('@editorjs/raw');
import ImageTool from '@editorjs/image';
const axios = require('axios');
var slugify = require('slugify');


const editor = new EditorJS({
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
            byFile: 'http://localhost:8008/uploadFile', // Your backend file uploader endpoint
            byUrl: 'http://localhost:8008/fetchUrl', // Your endpoint that provides uploading by Url
            }
        }
    }
  },
  autofocus: true,
  onReady: () => {
    renderBlocks();
  }
});

function renderBlocks(){
    let blocks = JSON.parse(document.getElementById('editor').dataset.blocks);
    console.log(blocks);
    editor.blocks.render(
        blocks
    );
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

if( document.getElementById('save-post') ){
    document.getElementById('save-post').addEventListener('click', function(){
        savePost();
    });
}

function closeSettingsBar(){
    document.getElementById('settings-sidebar').classList.remove('open');
    setTimeout(function(){
        document.getElementById('settings').classList.remove('open');
    }, 300);
}

function savePost(){
    editor.save().then((body) => {
        
        let slug = document.getElementById('slug').value;
        let title = document.getElementById('title').innerText;

        if( slug == "" ){
            slug = slugify(title);
        }

        axios.post('/save', {
            title: title,
            body: body,
            slug: slug.toLowerCase()
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });

    }).catch((error) => {
      console.log('Saving failed: ', error)
    });
}

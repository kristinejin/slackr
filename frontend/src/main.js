import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, isLoggedIn, setLogout } from './helpers.js';
import { login }    from './login.js'
// import * as bootstrap from 'bootstrap';
import 'bootstrap'; 
// const bootstrap = require('bootstrap');
// const myModalAlternative = new bootstrap.Modal('#myModal', options);

const popup = document.getElementById('error-popup');
const myModal = new bootstrap.Modal(document.getElementById('myModal'));
if (!isLoggedIn()) {
    document.getElementById('login').style.display = 'block';
    document.getElementById('reg').style.display = 'none';
    document.getElementById('logged-in').style.display = 'none';
} else {
    document.getElementById('logged-in').style.display = 'block';
    document.getElementById('logged-out').style.display = 'none';
}

const myModal = getElementById('modal');
const closeModal = getElementById('close-modal');
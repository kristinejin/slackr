import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, isLoggedIn } from './helpers.js';

/*
    Present logged in / logged out screen when get to the site
*/
if (isLoggedIn()) {
    document.getElementById('logged-out').classList.add('hide');
    document.getElementById('logged-in').classList.remove('hide');
} else {
    document.getElementById('login').classList.remove('hide');
    document.getElementById('logged-in').classList.add('hide');
}
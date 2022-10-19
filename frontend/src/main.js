import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, isLoggedIn, setLogout } from './helpers.js';

if (!isLoggedIn()) {
    document.getElementById('login').style.display = 'block';
    document.getElementById('reg').style.display = 'none';
    document.getElementById('logged-in').style.display = 'none';
} else {
    document.getElementById('logged-out').style.display = 'none';
    document.getElementById('logged-in').style.display = 'block';
}
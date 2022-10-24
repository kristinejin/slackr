import { BACKEND_PORT } from './config.js';
import { sendRequest } from './requests.js';
import { loadError } from './error.js';
import { loadChannels } from "./channels.js";

// email (text)
// password (password)
// submit button

//  when submit button is pressed, the form data should be sent to POST /auth/login to verify the credentials


export const setLogin = (data) => {
    localStorage.setItem('token', data['token']);
    localStorage.setItem('userId', data['userId']);
    document.getElementById('logged-out').classList.add('hide');
    document.getElementById('logged-in').classList.remove('hide');
    loadChannels();
}


// when user is not logged in, present a login form

const login = () => {
    // Redirect to register page
    const regLink = document.getElementById('redir-reg')
    regLink.addEventListener("click", () => {
        document.getElementById('login').classList.add('hide');
        document.getElementById('reg').classList.remove('hide');
    })

    // get all data from the dom
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    const btn = document.getElementById('login-btn');

    btn.addEventListener("click", (event) => {
        // post request to log in 
        sendRequest({
            route: '/auth/login', 
            method: 'POST', 
            body: {
            "email": email.value, 
            "password": password.value
        }}).then((data) => {
            setLogin(data);
        }).catch(data => {
            loadError(data);
        });
    });
}


login();
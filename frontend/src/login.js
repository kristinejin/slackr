import { BACKEND_PORT } from './config.js';
import { register } from './reg.js'
import { setLogin } from './helpers.js';
import { sendRequest } from './requests.js';

// email (text)
// password (password)
// submit button

//  when submit button is pressed, the form data should be sent to POST /auth/login to verify the credentials


// when user is not logged in, present a login form

login();


export function login() {
    // Redirect to register page
    const regLink = document.getElementById('redir-reg')
    regLink.addEventListener("click", () => {
        console.log("hello!!");
        document.getElementById('login').style.display='none';
        document.getElementById('reg').style.display='block';
    })

    // get all data from html doc

    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    const btn = document.getElementById('login-btn');

    btn.addEventListener("click", (event) => {
        // post request to log in 
        sendRequest('/auth/login', 'POST', {
            "email": email.value, 
            "password": password.value
        }).then((data) => {
            setLogin(data);
        });
    });
}


import { errors } from './error.js';
import { setLogin } from './helpers.js';
import { sendRequest } from './requests.js';
import { login } from './login.js';

register();

export function register() {

    const email = document.getElementById('reg-email');
    const name = document.getElementById('reg-name');
    const pass1 = document.getElementById('reg-pass1');
    const pass2 = document.getElementById('reg-pass2');

    pass2.addEventListener('onblur', () => {
        if (password1.value != password2.value) {
            console.log("password not match");
            // error('Password do not match!!');


        }
    })

    const btn = document.getElementById('reg-btn');

    btn.addEventListener("click", () => {
        // post request to register a user
        sendRequest('/auth/register', 'POST', {
            "email": email.value, 
            "name": name.value,
            "password": pass1.value,
        }).then((data) => {
            setLogin(data);
        })
    });
    
}




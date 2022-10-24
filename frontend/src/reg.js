import { setLogin } from './login.js';
import { sendRequest } from './requests.js';
import { loadError } from './error.js';

const register = () => {

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
        sendRequest({
            route: '/auth/register', 
            method: 'POST', 
            body: {
            "email": email.value, 
            "name": name.value,
            "password": pass1.value,}
        }).then((data) => {
            console.log(data);
            setLogin(data);
        }).catch(data => {
            console.log(data);
            loadError(data);
        });
    });
    
}

register();
import { setLogin } from './login.js';
import { sendRequest } from './requests.js';
import { loadError } from './error.js';


/*
    Request to register a new
*/
const register = () => {

    document.getElementById('redir-login').addEventListener('click', () => {
        document.getElementById('reg').classList.add('hide');
        document.getElementById('login').classList.remove('hide');
    })

    const email = document.getElementById('reg-email');
    const name = document.getElementById('reg-name');
    const pass1 = document.getElementById('reg-pass1');
    const pass2 = document.getElementById('reg-pass2');
    const btn = document.getElementById('reg-btn');
    btn.addEventListener("click", () => {
        if (pass1.value != pass2.value) {
            loadError('Password does not match');
            return;
        }
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
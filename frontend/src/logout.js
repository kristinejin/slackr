import { sendRequest } from "./requests.js";
import { loadError } from "./error.js";
import { removeAllChild } from "./helpers.js";


/*
    Set the logged out screen
*/
export function setLogout() {
    localStorage.clear();
    // remove all channel details
    document.getElementById('logged-in').classList.add('hide');
    document.getElementById('logged-out').classList.remove('hide');
    removeAllChild(document.getElementById('chat-box-body'));
    document.getElementById('chat-channel-name').innerText = 'Select a channel to start chatting...';
}


/*
    Request to log out user from current session
*/
const logoutBtn = document.getElementById('logout-btn');

logoutBtn.addEventListener('click', () => {
    // do logout 
    // clean all localstorage
    // request 
    sendRequest({
        route: '/auth/logout',
        method: 'POST',
        token: localStorage.getItem('token')
    }).then(() => {
        // redirect to logged out section   
        setLogout();
    }).catch(data => loadError(data))
})
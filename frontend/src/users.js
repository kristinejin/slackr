import { sendRequest } from "./requests.js";
import { fileToDataUrl } from "./helpers.js";
import { loadError } from "./error.js";

const inviteBtn = document.getElementById('channel-invite-btn');
inviteBtn.addEventListener('click', () => {
    // load user information
    // show invite modal
})

const userProfile = document.getElementById('user-profile-btn');
const userProfileModal = new bootstrap.Modal(document.getElementById('user-profile'));
const togglePassBtn = document.getElementById('user-profile-toggle-pass');

const userPass = document.getElementById('user-profile-new-pass');
const userName = document.getElementById('user-profile-name');
const userEmail = document.getElementById('user-profile-email');
const userBio = document.getElementById('user-profile-bio');
const userImage = document.getElementById('user-profile-pic');
const userNewImage = document.getElementById('user-profile-new-pic');

let currEmail;

const updateBtn = document.getElementById('user-profile-update-btn');
userProfile.addEventListener('click', () => {
    // set new password to default state
    togglePassBtn.classList.remove('bi-eye-slash');
    togglePassBtn.classList.add('bi-eye');
    userPass.type = 'password';
    userPass.value = '';


    // get user information

    sendRequest({
        route: '/user/' + localStorage.getItem('userId'),
        method: 'GET',
        token: localStorage.getItem('token')
    }).then(data => {
        // set data for modal
        console.log(data);
        userName.value = data.name;
        userEmail.value = data.email;
        currEmail = data.email;
        userBio.value = data.bio;
        if (data.image) {
            
            userImage.src = data.image;
        }
        userProfileModal.show();
    })
})

togglePassBtn.addEventListener('click', () => {
    if (userPass.type === 'password') {
        togglePassBtn.classList.remove('bi-eye');
        togglePassBtn.classList.add('bi-eye-slash');
        userPass.type = 'text';
    } 
    else {
        togglePassBtn.classList.remove('bi-eye-slash');
        togglePassBtn.classList.add('bi-eye');
        userPass.type = 'password';
    }
})

// record original user details


// update user profile
updateBtn.addEventListener('click', () => {
    // image

    // name
    const newName = userName.value;
    // email
    const newEmail = userEmail.value;
    // password
    const newPass = userPass.value;
    // bio
    const newBio = userBio.value;

    const requestBody = {
        "email": newEmail,
        "password": newPass,
        "name": newName,
        "bio": newBio,
    }

    Object.keys(requestBody).forEach(key => {
        
        if (key !== "bio" && (!requestBody[key])) {
            delete requestBody[key];
        }
        else if (key === 'email' && requestBody[key] === currEmail) {
            delete requestBody[key];
        }
    })

    if (userNewImage.files.length > 0) {
        fileToDataUrl(userNewImage.files[0])
            .then(data => {
                requestBody['image'] = data;
                return sendRequest({
                    route: '/user',
                    method: 'PUT',
                    body: requestBody,
                    token: localStorage.getItem('token')
                });
            })
            .then(data => {
                console.log('success image')
            })
            .catch(data => loadError(data));
    } 
    else {
        sendRequest({
            route: '/user',
            method: 'PUT',
            body: requestBody,
            token: localStorage.getItem('token')
        }).then(data => {
            console.log('success')
        })
        .catch(data => loadError(data));
    }
})




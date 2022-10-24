import { sendRequest } from "./requests.js";
import { cloneDiv, fileToDataUrl, removeAllChild } from "./helpers.js";
import { loadError } from "./error.js";
import { loadChannels } from "./channels.js";

const currUser = localStorage.getItem('token');
const getAllUsers = new Promise((resolve, reject) => {
    if (!localStorage.getItem('token')) {
        return;
    }
    sendRequest({
        route: '/user',
        method: 'GET',
        token: currUser
    }).then(data => {
        //data.users gives list of tuples containing {id: id, name: name}
        const users = data.users;
        Promise.all(users.map((user) => sendRequest({
            route: '/user/' + user.id, 
            method: 'GET',
            token: currUser
        }))).then((usersInfo) => {
            const names = [];
            for (const { email, name } of usersInfo) {
                names.push({name, email});
            }
            resolve({names: names, users:users});
        })
    }).catch(data => {
        loadError(data)
    })
});

const mergeInfo = (arr1, arr2) => {
    return arr1.map((names) => {
        const numbers = arr2.filter((users) => users['email'] === names['email']);
        names.id = numbers[0].id;
        return names;
    })
}

const inviteBtn = document.getElementById('channel-invite-btn');
const inviteModal = new bootstrap.Modal('#invite-modal');
const inviteBody = document.getElementById('invite-modal-body');

const resetInviteModal = () => {
    removeAllChild(inviteBody);
}
const inviteCheckboxId = 'invite-checkbox';

inviteBtn.addEventListener('click', () => {
    // load user information
    // show invite modal
    resetInviteModal();

    const channelMembers = [];

    sendRequest({
        route: '/channel/' + localStorage.getItem('currChannel'),
        method: 'GET',
        token: localStorage.getItem('token') 
    }).then(data => {
        channelMembers.push(...data.members);
        return getAllUsers;
    }).then((info) => {
        const userInfo = mergeInfo(info.names, info.users);

        // reference: https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
        userInfo.sort((a, b) => a.name.localeCompare(b.name));

        for (const user of userInfo) {
            const userEle = cloneDiv(inviteCheckboxId, 'invite-' + user.id);

            // make checkbox checked and disabled when a user is already a member of a channel
            if (channelMembers.includes(user.id)) {
                userEle.firstElementChild.setAttribute('disabled', '');
                userEle.firstElementChild.setAttribute('checked', '');
            }
            userEle.lastElementChild.innerText = user.name + ' (' + user.email + ')';
            inviteBody.appendChild(userEle);
        }
        
        inviteModal.show();
    })
})

const inviteSubmit = document.getElementById('invite-submit-btn');
inviteSubmit.addEventListener('click', () => {
    const invittEleArr = Array.from(inviteBody.children);
    invittEleArr.forEach(userEle => {
        // check user is already a member
        const isMember = userEle.firstElementChild.hasAttribute('disabled');

        const isChecked = userEle.firstElementChild.checked;

        const userId = parseInt(userEle.id.replace('invite-', ''));

        if (isChecked && !isMember) {
            // send request to invite user
            sendRequest({
                route: '/channel/' + localStorage.getItem('currChannel') + '/invite',
                method: 'POST',
                body: {
                    "userId": userId
                },
                token: currUser
            }).then(data => {
                console.log('user invited')
            }).catch(data => loadError(data));
        }

        inviteModal.hide();
    })
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

const setUserInfoOnModal = (data) => {
    userName.value = data.name;
    userEmail.value = data.email;
    currEmail = data.email;
    userBio.value = data.bio;
    if (data.image) { 
        userImage.src = data.image;
    }
}

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
        setUserInfoOnModal(data);
        userProfileModal.show();
    }).catch(data => loadError(data));
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

    // image
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
            .then(() => {
                // update new info on the doms
                loadChannels();
                userProfileModal.hide();
            })
            .catch(data => loadError(data));
    } 
    else {
        sendRequest({
            route: '/user',
            method: 'PUT',
            body: requestBody,
            token: localStorage.getItem('token')
        }).then(() => {
            // update new info on the doms
            loadChannels();
            userProfileModal.hide();
        })
        .catch(data => loadError(data));
    }
})




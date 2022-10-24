import { loadError } from './error.js'
import { sendRequest } from './requests.js'
import { createEventForChannel, viewChannel } from './channel.js';
import { cloneDiv, removeAllChild } from './helpers.js';


const parseChannels = (data) => {
    for (let channel of data.channels) {
        renderChannels(channel.name, channel.id, channel.private, channel.members);
    }
    createEventForChannel();
} 

export const loadChannels = () => {
    if (!localStorage.getItem('token')) {
        return;
    }
    const allChannels = document.getElementById('channel-parent');
    const newList = cloneDiv('channel-parent-template', 'channel-list');

    removeAllChild(allChannels);

    allChannels.append(newList)
   
    const userToken = localStorage.getItem('token');
    sendRequest({
        route: '/channel', 
        method: 'GET', 
        token: userToken
    })
        .then(data => {
            parseChannels(data);
            const currChannel = localStorage.getItem('currChannel');
            if (currChannel) {
                viewChannel(currChannel);
            }
        })
        .catch(data => loadError(data));

    
}

const checkIsMember = (userId, members) => {
    let isMember = false;
    members.forEach(member => {
        if (member.toString() === userId) {
            isMember = true;
        }
    });

    return isMember;
}

const renderChannels = (channelName, cid, isPrivate, members) => {
    if (!document.getElementById(toString(cid).id)) {
        let channelSection;
        let isMember = checkIsMember(localStorage.getItem('userId'), members);
        if (isPrivate) {
            if (!isMember) {
                return;
            }
            channelSection = document.getElementById('private-channel'); 
        }
        else {
            channelSection = document.getElementById('public-channel'); 
        }

        const newChannelTitle = document.createTextNode(channelName + ' ');
        const newChannel = document.createElement('li');
        newChannel.setAttribute('id', cid.toString());
        newChannel.classList.add('list-group-item', 'channel-elements', 'list-group-item-action');
        newChannel.appendChild(newChannelTitle);
        if (isMember) {
            const badge = document.createElement('span');
            badge.classList.add('badge','rounded-pill', 'text-bg-success', 'opacity-75', 'align-end');
            const badgeText = document.createTextNode('JOINED');
            badge.appendChild(badgeText);
            newChannel.appendChild(badge);
        }
        newChannel.setAttribute('is-member', isMember);
        channelSection.appendChild(newChannel);
    } 
}


const createChannels = () => {
    // --> TODO: to remove values from form
    const createChannelPopup = new bootstrap.Modal('#create-channel-popup');
    document.getElementById('create-channel-btn').addEventListener('click', () => {
        createChannelPopup.show();
    });

    const newChannelName = document.getElementById('create-channel-name');
    newChannelName.addEventListener('blur', () => {
        if (!newChannelName.value) {
            newChannelName.classList.add('is-invalid');
        }
    });

    newChannelName.addEventListener('keypress', () => {
        newChannelName.classList.remove('is-invalid');
    })

    document.getElementById('create-channel-submit').addEventListener('click', () => {
        // get all input
        const channelName = document.getElementById('create-channel-name');
        let channelDescription = document.getElementById('create-channel-description').value;
        const isPrivate = document.getElementById('create-channel-private');
        if (!channelDescription) {
            channelDescription = 'No description';
        }

        

        sendRequest({
            route: '/channel',
            method: 'POST',
            token: localStorage.getItem('token'),
            body: {
                "name": channelName.value,
                "private": isPrivate.checked,
                "description": channelDescription
            }
        }).then(data => console.log('channel created'))
        .catch(data => loadError(data));

        loadChannels();
        createChannelPopup.hide();
    });
}
loadChannels();
createChannels();


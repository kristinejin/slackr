import { loadChannels } from "./channels.js";
import { loadError } from "./error.js";
import { sendRequest } from "./requests.js";
import { cloneDiv } from "./helpers.js";
import { getMsg, resetMsgBody } from "./messages.js"

// 17-10 notes:
// TODO: 
// 1. enable edit --> text box etc
// 2. structure chat box --> new msg input
// 3. display messages --> recursive fetch messages?
// 4. change botton colors?s

// Global variable for detail popup:   
//      --> set to global scale to avoid duplicated modal being created when detail being opened multiple time
const detsPopup = new bootstrap.Modal(document.getElementById('channel-dets-template'));


export const createEventForChannel = () => {
    const allChannels = document.querySelectorAll('.channel-elements');
    allChannels.forEach((channel) => channel.addEventListener('click', () => {
        // open new screen
        viewChannel(channel.id);
    }));
}

// Display the join modal if authorised user is not a member of the channel that they selected on
const displayJoin = (cid, channel) => {
    const join = new bootstrap.Modal('#join-channel-popup');
    join.show();
    document.getElementById('join-channel-btn').addEventListener('click', () => {
        sendRequest({
            route: '/channel/' + cid + '/join',
            method: 'POST',
            token: localStorage.getItem('token')
        })
        .then(() => {
            channel.getAttribute('is-member', 'true');
            loadChannels();
            join.hide();
        })
        .catch(data => loadError(data));
    })
}

// Updates a channel's detail (name and description) based on the input value
const updateChannelDets = (cid) => {
    const newName = document.getElementById('channel-dets-name').value;
    let newDescription = document.getElementById('channel-dets-description').value;
    if (!newDescription) {
        newDescription = 'No description yet, add one now?';
    }
    sendRequest({
        route: '/channel/' + cid,
        method: 'PUT',
        body: {
            "name": newName,
            "description": newDescription
        },
        token: localStorage.getItem('token')
    }).then(() => {
        // // TODO: reload channel page
        sendRequest({
            route: '/channel/' + cid,
            method: 'GET',
            token: localStorage.getItem('token')
        }).then(data => {
            setIndiChannelView(data, cid);
        }).catch(data => setChannelDets(data));
    }).catch(data => loadError(data));
}

// Set the channel details of a channel
const setChannelDets = (channelDets) => {
    // Get channel creator info
    sendRequest({
        route: '/user/' + channelDets.creator,
        method: 'GET',
        token: localStorage.getItem('token')
    }).then(data => {
        document.getElementById('channel-dets-creator').innerText = data.name + ' (#' + channelDets.creator + ')';
    }).catch(data => loadError(data));

    // Set other channel details
    document.getElementById('channel-dets-date').innerText = channelDets.createdAt;
    document.getElementById('channel-dets-name').value = channelDets.name;
    document.getElementById('channel-dets-description').innerText = channelDets.description;
}

// Display channel detail modal from a channel
const showChannelDets = (channelDets, cid) => {
    setChannelDets(channelDets, cid);

    // open the detail modal
    detsPopup.show();

    const channelEdits = document.getElementsByClassName('channel-dets-edit-btn');
    Array.from(channelEdits).forEach(ele => ele.addEventListener('click', () => updateChannelDets(cid)));

    // event to leave channel
    document.getElementById('leave-channel-btn').addEventListener('click', () => {
        sendRequest({
            route: '/channel/' + cid + '/leave',
            method: 'POST',
            token: localStorage.getItem('token')
        }).then(data => {
            // TODO: success leave notification?
            loadChannels();
            detsPopup.hide();
            channelChat.classList.add('hide');
            document.getElementById('view-all-channels').classList.remove('hide');
        })
        .catch(data => loadError(data));
    });
}

const resizeChatBox = () => {
    const sidebarHeight = document.getElementById('channel-list-offcanvas').offsetHeight;
        const headerHeight = document.getElementById('header').offsetHeight;
        const btnHeight = document.getElementById('channel-list-toggle').offsetHeight;
        document.getElementById('channel-chat').style.height = `calc(${sidebarHeight}px - ${headerHeight}px - ${btnHeight}px - 0.50em)`;
}

// Set basic view of individual channel
const setIndiChannelView = (channelDets, cid) => {
    document.getElementById('chat-channel-name').innerText = channelDets.name;
    resizeChatBox();
    window.addEventListener('resize', () => resizeChatBox());
    resetMsgBody();
    getMsg(cid);

    localStorage.setItem('currChannel', cid.toString());

    // event to open channel details
    const infoBtn = document.getElementById('channel-info-btn');
    infoBtn.classList.remove('hide');
    infoBtn.addEventListener('click', () => showChannelDets(channelDets, cid));
}

// Redirect individual channels
export const viewChannel = (cid) => {
    const channel = document.getElementById(cid);
    if (channel.getAttribute('is-member') !== 'true') {
        displayJoin(cid, channel);
        return;
    }

    // get channel info
    sendRequest({
        route: '/channel/' + cid,
        method: 'GET',
        token: localStorage.getItem('token') 
    })
    .then(data => setIndiChannelView(data, cid))
    .catch(data => console.log(data));
}


const openChannelList = () => {
    // console.log(typeof(window.innerWidth));
    if (window.innerWidth >= 740) {
        document.getElementById("individual-channel").style.marginLeft = '400px';
    }
}
  
/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
const closeChannelList = () => {
    document.getElementById("individual-channel").style.marginLeft = '0';
}

const myOffcanvas = document.getElementById('channel-list-offcanvas');
myOffcanvas.addEventListener('hide.bs.offcanvas', event => {
    closeChannelList();
})

myOffcanvas.addEventListener('show.bs.offcanvas', event => {
    openChannelList();
})
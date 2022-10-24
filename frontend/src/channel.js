import { loadChannels } from "./channels.js";
import { loadError } from "./error.js";
import { sendRequest } from "./requests.js";
import { cloneDiv, removeAllChild } from "./helpers.js";
import { getMsg, resetMsgBody } from "./messages.js"

// Global variable for detail popup:   
//      --> set to global scale to avoid duplicated modal being created when detail being opened multiple time
const detsPopup = new bootstrap.Modal(document.getElementById('channel-dets-template'));

/*
    set event for each channel button on channel list
*/
export const createEventForChannel = () => {
    const allChannels = document.querySelectorAll('.channel-elements');
    allChannels.forEach((channel) => channel.addEventListener('click', () => {
        // open new screen
        viewChannel(channel.id);
    }));
}

/*
    Display the join modal if authorised user is not a member of the channel that they selected on
*/
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

/*
    Updates a channel's detail (name and description) based on the input value
*/
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
        sendRequest({
            route: '/channel/' + cid,
            method: 'GET',
            token: localStorage.getItem('token')
        }).then(data => {
            setIndiChannelView(data, cid);
        }).catch(data => setChannelDets(data));
    }).catch(data => loadError(data));
}

/*
    Set the channel details of a channel on the channel info modal
*/
const setChannelDets = (channelDets) => {
    // Get channel creator info
    sendRequest({
        route: '/user/' + channelDets.creator,
        method: 'GET',
        token: localStorage.getItem('token')
    }).then(data => {
        document.getElementById('channel-dets-creator').innerText = data.name + ' (' + data.email + ')';
    }).catch(data => loadError(data));

    // Set other channel details
    document.getElementById('channel-dets-date').innerText = channelDets.createdAt;
    document.getElementById('channel-dets-name').value = channelDets.name;
    document.getElementById('channel-dets-description').innerText = channelDets.description;
}

/* 
    Display channel detail modal from a channel
*/
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
            loadChannels();
            detsPopup.hide();
            channelChat.classList.add('hide');
            document.getElementById('view-all-channels').classList.remove('hide');
        })
        .catch(data => loadError(data));
    });
}

/*
    Resize the size of chat box according to the page size
*/
export const resizeChatBox = () => {
    const sidebarHeight = document.getElementById('channel-list-offcanvas').offsetHeight;
    const headerHeight = document.getElementById('header').offsetHeight;
    const btnHeight = document.getElementById('channel-list-toggle').offsetHeight;
    document.getElementById('channel-chat').style.height = `calc(${sidebarHeight}px - ${headerHeight}px - ${btnHeight}px)`;
}

/*
    Event to get channel information 
*/
const infoBtn = document.getElementById('channel-info-btn');
infoBtn.addEventListener('click', () => {
    const currChannel = localStorage.getItem('currChannel')
    if (!currChannel) {
        return;
    }
    sendRequest({ 
        route: '/channel/' + currChannel,
        method: 'GET',
        token: localStorage.getItem('token')
    }).then(data => {
        showChannelDets(data, currChannel);
    }).catch (data => console.log(data))
});

/*
    Request to get all the members
*/

const getAllMembers = (cid) => {
    return new Promise((resolve, reject) => {
        const currUser = localStorage.getItem('token');
        if (!currUser) {
            return;
        }
        sendRequest({
            route: '/channel/' + cid,
            method: 'GET',
            token: currUser
        }).then(data => {
            //data.users gives list of tuples containing {id: id, name: name}
            const members = data.members;
            // console.log(members);
            Promise.all(members.map((member) => sendRequest({
                route: '/user/' + member, 
                method: 'GET',
                token: currUser
            }))).then(userInfo => {
                resolve(userInfo);
            })
        }).catch(data => {
            reject(data);
        })
    })
};

/*
    Show all the members in a channel in a modal
*/
const memberModal = new bootstrap.Modal('#members-modal');
const viewAllMembers = (cid) => {
    const memberBody = document.getElementById('members-modal-body');
    const memberTempId = 'member-template';
    removeAllChild(memberBody);
    // console.log(memberBody);
    getAllMembers(cid)
        .then(data => {
            // console.log(data);
            data.forEach(member => {
                // show member on the modal
                const memberEle = cloneDiv(memberTempId);
                const memberInner = memberEle.children;
                if (member.image) {
                    memberInner[0].src = member.image;
                }
                memberInner[1].innerText = member.name;
                memberInner[2].innerText = '(' + member.email + ')';
                memberBody.append(memberEle);
            })

            memberModal.show();
        }).catch(data => loadError(data))
       
}

/*
    Set the event for showing all members in channel button
*/

const membersBtn = document.getElementById('channel-members-btn');
membersBtn.addEventListener('click', () => {
    const currChannel = localStorage.getItem('currChannel')
    if (!currChannel) {
        return;
    }
   viewAllMembers(currChannel);
})

/*
    Set basic view of individual channel and add event for channel buttons
*/
const setIndiChannelView = (channelDets, cid) => {
    document.getElementById('chat-channel-name').innerText = channelDets.name;
    resizeChatBox();
    window.addEventListener('resize', () => resizeChatBox());
    resetMsgBody();
    getMsg(cid);

    localStorage.setItem('currChannel', cid.toString());
}

/* 
    Redirect individual channels on the channel list 
    to either the individual channel page or option to join
*/
export const viewChannel = (cid) => {
    const channel = document.getElementById(cid);
    // get channel info
    sendRequest({
        route: '/channel/' + cid,
        method: 'GET',
        token: localStorage.getItem('token') 
    })
    .then(data => setIndiChannelView(data, cid))
    .catch(data => displayJoin(cid, channel));
}

/*
    Enables channel list toggle 
*/

// set the chat box to the left
const openChannelList = () => {
    if (window.innerWidth >= 740) {
        document.getElementById("individual-channel").style.marginLeft = '400px';
    }
}
  
// set the chat box to full page
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
import { loadError } from "./error.js";
import { sendRequest, sendRequestRaw } from "./requests.js";
import { cloneDiv, parseDate, fileToDataUrl, removeAllChild } from "./helpers.js";

// ----------------------------------
// Fetch all messages from a channel
// ----------------------------------

/*
    Get one set of messages (up to 25 messages per set)
*/
const getOnePage = (channel, start) => {
    return fetch(
        "http://localhost:5005" + '/message/' + channel + '?start=' + start, 
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            method: 'GET',
        }
    )
    .then(res => {
        return res.json();
    });
}

/*
    Fetch all message in the channel 
    returns an array of messages
*/
const fetchAllMsg = (channel) => {

    const messages = [];
    let start = 0;

    const recursive = (page) => {
        // check
        const msgArr = Array.from(page.messages);
        if (msgArr.length <= 0) {
            return messages;
        }

        messages.push(...msgArr);
        start += 25;
        return getOnePage(channel, start).then(recursive);
    }

    return getOnePage(channel, start).then(recursive);
}


// -----------------------------------
// --------------Helpers--------------
// -----------------------------------


const showEditedStatus = (msgEle) => {
    const msgEditedStatus = msgEle.children[1].children[0].children[2];
    msgEditedStatus.classList.remove('hide');
};

const setMsgBody = (msgEle, msg) => {
    const msgBody = msgEle.children[1].children[1];
    msgBody.innerText = msg;

    const cleanId = msgEle.id.replace('pinned-', '');
    const mainMsgEle = document.getElementById(cleanId);
    if (mainMsgEle !== null) {
        const mainMsgBody = mainMsgEle.children[1].children[1];
        mainMsgBody.innerText = msg;
    }
}

const setTime = (msgEle, rawDate) => {
    const msgTime = msgEle.children[1].children[0].children[1];
    const dates = parseDate(rawDate);
    msgTime.innerText = dates;
}

const showElements = (elements) => {
    elements.forEach(ele => {
        ele.classList.remove('hide');
    })
}

const hideElements = (elements) => {
    elements.forEach(ele => {
        ele.classList.add('hide');
    })
}

const switchIcon = (ele, from, to) => {
    ele.classList.remove(from);
    ele.classList.add(to);
}



// ----------------------------------
// Remove message
// ----------------------------------
const removeMsgDOM = (msgEle) => {
    const ele = document.querySelector(`[mid="${msgEle.id}"]`);
    ele.remove();
}

const removeMsg = (msgEle) => {
    // remove an message
    const channelId = localStorage.getItem('currChannel');
    const msgId = msgEle.id.replace('pinned-', '');
    sendRequest({
        route: '/message/' + channelId + '/' + msgId,
        method: 'DELETE',
        token: localStorage.getItem('token')
    }).then(() => {
        removeMsgDOM(msgEle);
    }).catch((data) => loadError(data));
}

// ----------------------------------
// --------------Edit----------------
// ----------------------------------

/*
    Update message information on the dom
*/
const editMsgDOM = (msgEle, channelId) => {
    // update message in the dom
    // add edited indication
    // update timestamp
    // update message
    fetchAllMsg(channelId)
        .then(messages => {
            messages.forEach(msg => {
                if (msg.id === parseInt(msgEle.id)) {
                    setMsgBody(msgEle, msg.message);
                    setTime(msgEle, msg.editedAt);
                    showEditedStatus(msgEle);
                }
            })
        })
}

/*
    Edit message request
*/
const editMsg = (msgEle) => {
    const editModal = new bootstrap.Modal(document.getElementById('edit-msg-modal'));
    const msgBodyHtml = msgEle.children[1].children[1];
    const editModalInput = document.getElementById('edit-msg-modal-body');
    const currMsg = msgBodyHtml.innerText;
    editModalInput.value = currMsg;
    editModal.show();

    const editModalBtn = document.getElementById('edit-msg-modal-btn');
    

    const channelId = localStorage.getItem('currChannel');
    const msgId = msgEle.id.replace('pinned-', '');
    editModalBtn.addEventListener('click', () => {
        // show error if message is the same
        const editedMsg = editModalInput.value;
        if (editedMsg === currMsg || !editedMsg || editedMsg.trim().length === 0) {
            editModalInput.classList.add('is-invalid');
        } else {
            sendRequest({
                route: '/message/' + channelId + '/' + msgId,
                method: 'PUT',
                body: {
                    "message": editedMsg
                },
                token: localStorage.getItem('token')
            }).then(() => {
                // update this on the dom 
                editModal.hide();
                editMsgDOM(msgEle, channelId);
            })
        }
    });

    editModalInput.addEventListener('keyup', () => {
        // check msg is different with current msg and not empty
        const editedMsg = editModalInput.value;
        if (editedMsg !== currMsg) {
            editModalInput.classList.remove('is-invalid');
        } 

        if (editedMsg || editedMsg.trim().length !== 0) {
            editModalBtn.classList.remove('disabled');
        } else {
            editModalBtn.classList.add('disabled');
        }
    })
     
}

/*
    update edited image on the dom
*/
const updateImg = (msgEle, channel) => {
    const input = document.getElementById('edit-img-input');
    const file = input.files[0];
    const msgId = msgEle.id.replace('pinned-', '');
    fileToDataUrl(file)
        .then(data => {
            return sendRequest({
                route: '/message/' + channel + '/' + msgId,
                method: 'PUT',
                body: {
                    image: data
                },
                token: localStorage.getItem('token')
            })
        }).then(() => {
            console.log(msgId)
            return fetchAllMsg(channel);
        }).then(messages => {
            console.log(messages);
            messages.forEach(msg => {
                if (msg.id === parseInt(msgEle.id)) {
                    displayImageChannel(msgEle, msg.image);
                    setTime(msgEle, msg.editedAt);
                    showEditedStatus(msgEle);
                }
            })
        }).catch(data => loadError(data));
        
}

/*
    Edit image request
*/
const editImg = (msgEle, channel) => {
    const editModalEle = document.getElementById('edit-img-modal');
    const editModal = new bootstrap.Modal(editModalEle);
    const editBody = document.getElementById('edit-img-body');
    if (editBody.children.length > 1) {
        editBody.removeChild(editBody.firstChild);
    }

    const imgHtml = msgEle.children[1].children[1].firstElementChild.cloneNode(true);

    editBody.insertBefore(imgHtml, editBody.firstChild);
    editModal.show();

    const editBtn = document.getElementById('edit-img-btn');
    
    editBtn.addEventListener('click', () => {
        updateImg(msgEle, channel)
        editModal.hide();
    });
    editModalEle.addEventListener('hidden.bs.modal', () => {
        editBtn.removeEventListener('click', updateImg(msgEle, channel));
    })
}

// ----------------------------------
// -----------Action Icon------------
// ----------------------------------

/*
    Create an icon and append to an element
*/
const createMsgActionIcon = (element, type, identifier) => {
    const action = document.createElement('i');
    action.classList.add('bi', type, 'action-icon', identifier);
    element.appendChild(action);
    return action;
}

/*
    Get a child from an element that contains a targted class name
*/
const getActionComponent = (element, target) => {
    let result;
    element.forEach(child => {
        if (child.classList.contains(target)) {
            result = child;
        }
    })
    return result;
}

// ----------------------------------
// -----------React Icons------------
// ----------------------------------

/*
    Create an reaction element and append to an element
*/
const cloneAndAppendReaction = (element, reactId) => {
    const react = cloneDiv(reactId);
    react.classList.add('action-icon', reactId, 'hide');
    react.setAttribute('reacted', false);
    return element.appendChild(react);
}

/*
    Makes request to react to a message 
*/
const reactRequest = (channel, msgId, reactName, type) => {
    // send request
    const cleanId = msgId.replace('pinned-', '');
    return sendRequestRaw({
        route: '/message/' + type + '/' + channel + '/' + cleanId,
        method: 'POST',
        body: {
            "react": reactName
        },
        token: localStorage.getItem('token')
    });          
}


/*
    Returns the new reaction count
*/  
const updateReactNum = (reactEle, isIncrement) => {
    //  -> a number after that react to indicate amount of that react have been reacted
    const count = reactEle.children[0];
    if (isIncrement) {
        return parseInt(count.innerText) + 1;
    }
    else {
        return parseInt(count.innerText) - 1;
    }
}

/*
    Load an reaction details (number of reacts to that reaction and 
    whether if the authorised user is reacted) to the document
*/
const loadReactToDom = (reactEle, isUser, count, unchangeBg, msgId, reactId) => {
    // load react to the dom
    // 1. decide what form we will be taking 
    //  -> change of background for the user's reaction
    if (isUser) {
        // do above
        reactEle.style.backgroundColor = '#F1DFB0';
    }

    if (unchangeBg) {
        reactEle.style.backgroundColor = null;
    }
    
    const countEle = reactEle.children[0];
    countEle.innerText = count;
    
    const cleanId = msgId.replace('pinned-', '');
    const bodyActionParent = document.getElementById('actions-' + cleanId);
    if (bodyActionParent !== null) {
        // find the element
        Array.from(bodyActionParent.children).forEach(child => {
            if (child.classList.contains(reactId)) {
                if (isUser) {
                    // do above
                    child.style.backgroundColor = '#F1DFB0';
                    child.setAttribute('reacted', 'true');
                }
            
                if (unchangeBg) {
                    child.style.backgroundColor = null;
                    child.setAttribute('reacted', 'false');
                }
                const childCount = child.children[0];
                childCount.innerText = count;
            }
        })
    }

};



/*
    Request for reacting to an message
*/
const handleReact = (reactEle, channel, msgEle, reactId) => {
    reactRequest(channel, msgEle.id, reactId, 'react')
        .then(data => {
            if (data.error) {
                loadError(data.error);
            }
            else {
                reactEle.setAttribute('reacted', 'true');
                loadReactToDom(reactEle, true, updateReactNum(reactEle, true), false, msgEle.id, reactId);
            }
        })
        .catch(data => loadError(data));
}
/*
    Request for unreacting to an message
*/
const handleUnreact = (reactEle, channel, msgEle, reactId) => {
    reactRequest(channel, msgEle.id, reactId, 'unreact')
        .then(data => {
            if (data.error) {
                loadError(data.error);
            }
            else {
                loadReactToDom(reactEle, false, updateReactNum(reactEle, false), true, msgEle.id, reactId);
                reactEle.setAttribute('reacted', 'false');
            }
        })
        .catch(data => loadError(data));
}

/*
    Event for reacting to an individual message
*/
const reactEvent = (react, channel, msgEle, reactId) => {
    // 1. add react listener
    react.addEventListener('click', () => {
        // below: if message is unreacted
        // check if message have been reacted by the user
        if (react.getAttribute('reacted') === 'false') {
            handleReact(react, channel, msgEle, reactId);
        }
        else {
            handleUnreact(react, channel, msgEle, reactId);
        }
    })
}

/*
    Match the reacts data from the channel detail request to the react element on the dom
*/
const matchReacts = (reactsData, reactId, reactEle) => {
    let count = 0;
    let isUser = false;
    reactsData.forEach(r => {
        if (r.react === reactId) {
            count++;
            if (r.user.toString() === localStorage.getItem('userId')) {
                reactEle.setAttribute('reacted', true);
                isUser = true;
            }
        }
    });
    return {count: count, isUser: isUser};
}
/*
    Sets all the required information for a single reaction 
*/
const singleReactMain = (reactEles, reactIds, index, reactsData, channel, msgEle) => {
    // reaction 
    const react = reactEles[index];
    const reactId = reactIds[index];
    const parsed = matchReacts(reactsData, reactId, react);
    loadReactToDom(react, parsed.isUser, parsed.count, false, msgEle.id, reactId);
    reactEvent(react, channel, msgEle, reactId);
}


/*
    Set up all the reactions of a message
*/
const msgReact = (actionList, reactIds, reactEles, msgEle, channel, reactsData) => {
    
    // react button event to open reaction menu
    const reactBtn = getActionComponent(actionList, 'react');
    reactBtn.addEventListener('click', () => {
        hideElements(actionList);
        reactBtn.classList.remove('hide');
        reactBtn.style.transform = 'scale(1.2)';
        showElements(reactEles);
    })
    
    // set reaction icons and add events
    singleReactMain(reactEles, reactIds, 0, reactsData, channel, msgEle);
    singleReactMain(reactEles, reactIds, 1, reactsData, channel, msgEle);
    singleReactMain(reactEles, reactIds, 2, reactsData, channel, msgEle);

    // reaction menu close button event
    const close = reactEles[3];
    close.addEventListener('click', () => {
        hideElements(reactEles);
        reactBtn.style.transform = null;
        showElements(actionList);
    });   
}


// ----------------------------------
// ----------Set Sender Msg----------
// ----------------------------------

const pinBoard = new bootstrap.Modal(document.getElementById('pinned-board'));

/*
    display a message sent by the authorised user in a channel chat
*/
const setSenderMsg = (senderEle, msgActionParent, msgEle, msg, channel) => {
    senderEle.classList.add('senderName');

    const remove = createMsgActionIcon(msgActionParent, 'bi-trash', 'remove');
    const edit = createMsgActionIcon(msgActionParent, 'bi-pencil-square', 'edit');
    
    remove.addEventListener('click', () => removeMsg(msgEle));
    edit.addEventListener('click', () => {
        // close pin modal modal
        if (!msgActionParent.id) {
            pinBoard.hide();
        }
        if (msg.image) {
            editImg(msgEle, channel);
        }
        else {
            editMsg(msgEle);
        }
        
    });
    return [remove, edit];
}


// ----------------------------------
// -----------Pin Messages-----------
// ----------------------------------

/*
    Set the vision of a pinned message on the dom
*/
const setPinned = (pin, msgEle) => {
    
    msgEle.setAttribute('pinned', 'true');
    switchIcon(pin, 'bi-pin-angle', 'bi-pin-angle-fill');

    const cleanId = msgEle.id.replace('pinned-', '');

    const bodyMsgEle = document.getElementById(cleanId);
    if (bodyMsgEle !== null) {
        bodyMsgEle.setAttribute('pinned', 'true');
    }

    const bodyPin = document.getElementById('pin-' + cleanId); 
    if (bodyPin !== null) {
        switchIcon(pin, 'bi-pin-angle', 'bi-pin-angle-fill');
    }
    
}

/*
    Set the vision of a unpinned message on the dom
*/
const setUnpinned = (pin, msgEle) => {
    msgEle.setAttribute('pinned', 'false');
    switchIcon(pin, 'bi-pin-angle-fill', 'bi-pin-angle');

    const cleanId = msgEle.id.replace('pinned-', '');
    const bodyMsgEle = document.getElementById(cleanId);
    if (bodyMsgEle !== null) {
        bodyMsgEle.setAttribute('pinned', 'false');
    }

    const bodyPin = document.getElementById('pin-' + cleanId); 
    if (bodyPin !== null) {
        switchIcon(bodyPin, 'bi-pin-angle-fill', 'bi-pin-angle');
    }
}

/*
    Set the vision of a pinned message on the dom
*/
const pinMsgMain = (pin, msgEle, channel, msgId) => {
    //  2. pin
    pin.addEventListener('click', () => {
        console.log('activate pin')
        // check if element already pinned
        if (msgEle.getAttribute('pinned') === 'true') {
            // do unpin 
            // 2. change to unpinned on the dom
            
            sendRequest({
                route: '/message/unpin/' + channel + '/' + msgId,
                method: 'POST',
                token: localStorage.getItem('token')
            }).then(data => {
                // 2. change to pinned on the dom
                setUnpinned(pin, msgEle);
            }).catch(data => loadError(data));
        }
        else {
            // 1. request
            sendRequest({
                route: '/message/pin/' + channel + '/' + msgId,
                method: 'POST',
                token: localStorage.getItem('token')
            }).then(data => {
                // 2. change to pinned on the dom
                setPinned(pin, msgEle);
            }).catch(data => loadError(data));
        }
    })
}


// ----------------------------------
// ----------Member Profile----------
// ----------------------------------

// Member Profile Modal
const publicUserProfile = new bootstrap.Modal('#public-user-profile');

/*
    Display a user profile for members in a channel
*/
const displaySenderProfile = (senderUid, msgSenderHtml) => {
    msgSenderHtml.addEventListener('click', () => {
        // senderUid
        // get sender info

        const profilePic = document.getElementById('public-user-profile-pic');
        const name = document.getElementById('public-user-profile-name');
        const bio = document.getElementById('public-user-profile-bio');
        const email = document.getElementById('public-user-profile-email');
        sendRequest({
            route: '/user/' + senderUid,
            method: 'GET',
            token: localStorage.getItem('token')
        }).then(data => {
            if (data.image) {
                profilePic.src = data.image;
            }
            name.innerText = data.name;
            bio.innerText = data.bio;
            email.innerText = data.email;
            publicUserProfile.show();
        })
    });
}


// ----------------------------------
// ----------Channel Images----------
// ----------------------------------

/* 
    Takes in an element for displaying message and an image,
    add image to the given element
    returns the added image element
*/
const displayImageChannel = (msgEle, imageData) => {
    const msgBody = msgEle.lastElementChild.lastElementChild;
    if (msgBody.children.length > 0) {
        removeAllChild(msgBody);
    }
    const imageEle = document.createElement('img');
    // imageEle.setAttribute('id', something) ??
    imageEle.src = imageData;
    imageEle.alt = "image sent by user";
    imageEle.classList.add('chat-img');
    msgBody.appendChild(imageEle);
    return imageEle;
}

/*
    Get all images and load them to a modal
*/
const allImgModal = new bootstrap.Modal('#all-img-modal');
const allImgBody = document.getElementById('all-img-body');
const loadImgToCarousel = (messages, firstId) => {
    messages = messages.reverse();
    messages.forEach(msg => {
        if (msg.image) {
            const item = cloneDiv('carousel-item-template');
            if (msg.id === parseInt(firstId)) {
                item.classList.add('active');
            }
            const image = cloneDiv('carousel-img-template');
            image.src = msg.image;
            item.appendChild(image);
            allImgBody.appendChild(item);
        }
    })
}

/*
    Enlarge an image in a modal when image is clicked in chat
*/
const displayImageInModal = (imageEle, msgId, channelId) => {
    imageEle.addEventListener('click', () => {
        // load all image to allImgBody 
        fetchAllMsg(channelId)
            .then(data => {
                removeAllChild(allImgBody);
                loadImgToCarousel(data, msgId);
                allImgModal.show();
            })
    })
}

// ----------------------------------
// -----------Channel Main-----------
// ----------------------------------

/*
    Hides message actions (edit/delete/pin/react)
*/
const hideMsgAction = (msgEle) => {
    const msgActionParent = msgEle.children[1].children[0].children[3];
    msgActionParent.classList.add('hide');
};

/*
    Displays message actions (edit/delete/pin/react)
*/
const showMsgAction = (msgEle) => {
    const msgActionParent = msgEle.children[1].children[0].children[3];
    msgActionParent.classList.remove('hide');
};


/*
    display a message in a channel chat
*/
const displayMsg = (msg, appendStart, appendTo, idPrefix) => {
    // clone the message template
    const newMsg = cloneDiv('msg-template', `${msg.id}`);
    newMsg.setAttribute('mid', newMsg.id);

    const channelId = localStorage.getItem('currChannel');
    let imageEle;
    if (msg.message) {
        setMsgBody(newMsg, msg.message);
    } else {
        imageEle = displayImageChannel(newMsg, msg.image);
    }

    if (imageEle) {
        displayImageInModal(imageEle, newMsg.id, channelId);
    }

    // record sender userId on the dom
    const senderUid = msg.sender;
    const msgSenderHtml = newMsg.children[1].children[0].children[0];
    msgSenderHtml.setAttribute('sendId', senderUid.toString());

    // set eventlistener for clicking sender name, and displays profiles when event fired
    displaySenderProfile(senderUid, msgSenderHtml);

    // get all required html fields for message actions (pin/react/delete/edit)
    const msgActionParent = newMsg.children[1].children[0].children[3];
    const actionEle = [];
    if (senderUid.toString() === localStorage.getItem('userId')) {
        actionEle.push(...setSenderMsg(msgSenderHtml, msgActionParent, newMsg, msg, channelId));
    }

    // msg pin
    const pin = createMsgActionIcon(msgActionParent, 'bi-pin-angle', 'pin');
    actionEle.push(pin);
    if (idPrefix !== undefined) {
        newMsg.setAttribute('id', idPrefix + newMsg.id);
        newMsg.setAttribute('mid', newMsg.id);
    } else {
        pin.setAttribute('id', 'pin-' + newMsg.id);
        msgActionParent.setAttribute('id', 'actions-' + newMsg.id)
    }

    // msg react
    actionEle.push(createMsgActionIcon(msgActionParent, 'bi-emoji-sunglasses', 'react'));

    const reactEles = [];
    const reactIds = ['reaction-sunglasses', 'reaction-ghost', 'reaction-face'];

    reactEles.push(cloneAndAppendReaction(msgActionParent, reactIds[0]));
    reactEles.push(cloneAndAppendReaction(msgActionParent, reactIds[1]));
    reactEles.push(cloneAndAppendReaction(msgActionParent, reactIds[2]));
    const close = createMsgActionIcon(msgActionParent, 'bi-x', 'reaction-close');
    close.classList.add('hide');
    reactEles.push(close);

    //  Set pin/unpin message event 
    if (msg.pinned) {
        // change message icon to pinned 
        setPinned(pin, newMsg);
    }
    pinMsgMain(pin, newMsg, channelId, msg.id);
    
    msgReact(actionEle, reactIds, reactEles, newMsg, channelId, msg.reacts);

    // get sender information
    const userProfilePic = newMsg.children[0];
    sendRequest({
        route: '/user/' + senderUid,
        method: 'GET',
        token: localStorage.getItem('token')
    }).then(data => {
        msgSenderHtml.innerText = data.name;
        if (data.image) {
            userProfilePic.src = data.image;  
        }
    })

    if (msg.edited) {
        setTime(newMsg, msg.editedAt);
        showEditedStatus(newMsg);
    } else {
        setTime(newMsg, msg.sentAt);
    }

    // append new messages to the start of chat 
    if (appendStart) {
        const firstChild = appendTo.firstChild;
        appendTo.insertBefore(newMsg, firstChild);
    }
    else {
        appendTo.appendChild(newMsg);
    }

    newMsg.addEventListener('mouseover', () => showMsgAction(newMsg));
    newMsg.addEventListener('mouseout', () => hideMsgAction(newMsg));
}

/*
    reset the message body to be empty
*/
export const resetMsgBody = () => {
    const chatBody =  document.getElementById('chat-box-body');
    removeAllChild(chatBody);
    document.getElementById('msg-input').value = '';
    localStorage.setItem('msgStart', '0');
    localStorage.setItem('lastScrollTop', '0');
}

/*
    Display a set of messages
*/
const processMsges = (msgArr) => {
    let msgStart = parseInt(localStorage.getItem('msgStart'));
    if (msgArr.length > 0) {
        msgStart += 25;
        localStorage.setItem('msgStart', msgStart.toString());
    } 
    msgArr.forEach(msg => displayMsg(msg, true, document.getElementById('chat-box-body')));
}

/*
    Fetch a new set of messages from the start index
*/
export const getMsg = (cid) => {
    // fetch messages
    const loadingIcon = document.getElementById('msg-loading-icon');
    loadingIcon.classList.remove('hide');
    sendRequest({
        route: '/message/' + cid + '?start=' + localStorage.getItem('msgStart'),
        method: 'GET',
        token: localStorage.getItem('token') 
    })
    .then(data => {
        loadingIcon.classList.add('hide');
        processMsges(data.messages);
    })
    .catch(data => loadError(data));
}


/*
    Disables the send button when the message input is empty or contains only spaces
    Enables it the vice versa
*/
const msgInput = document.getElementById('msg-input');
const sendMsgBtn = document.getElementById('send-msg-btn');
msgInput.addEventListener('keyup', () => {

    if(msgInput.value && msgInput.value.trim().length !== 0) {
        sendMsgBtn.classList.remove('disabled');
    } else {
        sendMsgBtn.classList.add('disabled');
    }
})

/*
    Display the newest message in a channel
*/
const displayNewMsg = (cid) => {
    // fetch messages
    sendRequest({
        route: '/message/' + cid + '?start=0',
        method: 'GET',
        token: localStorage.getItem('token') 
    })
    .then(data => {
        displayMsg(data.messages[0], false, document.getElementById('chat-box-body'));
    })
    .catch(data => loadError(data));
}

/*
    Send Message in Chats
*/
sendMsgBtn.addEventListener('click', () => {
    const msgToSend = msgInput.value;
    const currChannel = localStorage.getItem('currChannel');
    sendRequest({
        route: '/message/' + currChannel,
        method: 'POST',
        body: {
            "message": msgToSend
        },
        token: localStorage.getItem('token')
    }).then(() => {
        msgInput.value = '';
        displayNewMsg(currChannel);
    }).catch(data => loadError(data));
});


/*
    Infinite Scolling in chats
*/
const element = document.getElementById('chat-box-parent');
element.onscroll = (e)=>{
    let lastScrollTop = parseInt(localStorage.getItem('lastScrollTop'));
    const scrollContainer = document.getElementById('chat-box-body');
    let adjusted = element.scrollTop * -1;
    if (adjusted < lastScrollTop){
        // upscroll 
        return;
    } 

    lastScrollTop = adjusted <= 0 ? 0 : adjusted;
    localStorage.setItem('lastScrollTop', lastScrollTop.toString());
    
    if (adjusted + element.offsetHeight>= scrollContainer.scrollHeight){
        getMsg(localStorage.getItem('currChannel'));
    }
}


/*
    Show all Pinned Messages on a modal
*/
const showPinBtn = document.getElementById('pinned-msg-btn');
showPinBtn.addEventListener('click', () => {
    const channel = localStorage.getItem('currChannel');
    const pinBoardBody = document.getElementById('pinned-msg-body');
    // 1. get all messages
    removeAllChild(pinBoardBody);
    fetchAllMsg(channel)
        .then(data => {
            // remove all element in pinboard body
            data.forEach(msg => {
                if (msg.pinned) {
                    // display message on  the pinned board with different id
                    //  --> change display msg function
                    displayMsg(msg, true, pinBoardBody, 'pinned-');
                }
            })
            pinBoard.show();
        })
        .catch(data => loadError(data));
})



/*
    Upload Image in Chats
*/
const imageBtn = document.getElementById('send-image-btn');
const imageUpload = document.getElementById('chat-image-upload');
imageBtn.addEventListener('click', () => {
    imageUpload.click();
})

imageUpload.addEventListener('change', () => {
    const newImage = imageUpload.files[0];
    const channel = localStorage.getItem('currChannel');
    fileToDataUrl(newImage)
        .then(data => {
            return sendRequest({
                route: '/message/' + channel,
                method: 'POST',
                body: {
                    "image": data
                },
                token: localStorage.getItem('token')
            })
        })
        .then(() => {
            // want to display the new message
            displayNewMsg(channel);
        })
        .catch(data => loadError(data))
})


import { loadError } from "./error.js";
import { sendRequest, sendRequestRaw } from "./requests.js";
import { cloneDiv, parseDate, fileToDataUrl } from "./helpers.js";

// 21/10 TODO for tmrw:
//  --> Bug: when close the thing, it does not update

const pinBoard = new bootstrap.Modal(document.getElementById('pinned-board'));

// ----------------------------------
// Fetch all
// ----------------------------------
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

const removeAllChild = (ele) => {
    while(ele.firstChild) {
        ele.removeChild(ele.lastChild);
    }
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

const editMsg = (msgEle) => {
    // modal for message input
    // request
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

// ----------------------------------
// -----------Action Icon------------
// ----------------------------------

const createMsgActionIcon = (msgReactParent, type, identifier) => {
    const action = document.createElement('i');
    action.classList.add('bi', type, 'action-icon', identifier);
    msgReactParent.appendChild(action);
    return action;
}

const getActionComponent = (actionList, target) => {
    let targetAction;
    actionList.forEach(action => {
        if (action.classList.contains(target)) {
            targetAction = action;
        }
    })
    return targetAction;
}

// ----------------------------------
// -----------React Icons------------
// ----------------------------------

const cloneAndAppendReaction = (msgReactParent, reactId) => {
    const react = cloneDiv(reactId);
    react.classList.add('action-icon', reactId, 'hide');
    react.setAttribute('reacted', false);
    return msgReactParent.appendChild(react);
}

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

const singleReactMain = (reactEles, reactIds, index, reactsData, channel, msgEle) => {
    // reaction 
    const react = reactEles[index];
    const reactId = reactIds[index];
    const parsed = matchReacts(reactsData, reactId, react);
    loadReactToDom(react, parsed.isUser, parsed.count, false, msgEle.id, reactId);
    reactEvent(react, channel, msgEle, reactId);
}

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


// display a message send by authorised user
const setSenderMsg = (senderEle, msgReactParent, msgEle) => {
    senderEle.classList.add('senderName');

    // TODO: make this a function?
    const remove = createMsgActionIcon(msgReactParent, 'bi-trash', 'remove');
    const edit = createMsgActionIcon(msgReactParent, 'bi-pencil-square', 'edit');
    
    remove.addEventListener('click', () => removeMsg(msgEle));
    edit.addEventListener('click', () => {
        // close pin modal modal
        if (!msgReactParent.id) {
            pinBoard.hide();
        }
    
        editMsg(msgEle);
    });
    return [remove, edit];
}


const hideMsgAction = (msgEle) => {
    const msgReactParent = msgEle.children[1].children[0].children[3];
    msgReactParent.classList.add('hide');
    
};

const showMsgAction = (msgEle) => {
    const msgReactParent = msgEle.children[1].children[0].children[3];
    msgReactParent.classList.remove('hide');
};

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

// display a message in the chat
const displayMsg = (msg, appendStart, appendTo, idPrefix) => {
    // clone the message template
    const newMsg = cloneDiv('msg-template', `${msg.id}`);
    newMsg.setAttribute('mid', newMsg.id);

    // sender details (name, profile pic)
    // images of message

    setMsgBody(newMsg, msg.message);

    // get all required html fields
    const senderUid = msg.sender;
    const msgSenderHtml = newMsg.children[1].children[0].children[0];
    const msgReactParent = newMsg.children[1].children[0].children[3];
    const actionEle = [];
    if (senderUid.toString() === localStorage.getItem('userId')) {
        actionEle.push(...setSenderMsg(msgSenderHtml, msgReactParent, newMsg));
    }

    // msg pin
    const pin = createMsgActionIcon(msgReactParent, 'bi-pin-angle', 'pin');
    actionEle.push(pin);
    if (idPrefix !== undefined) {
        newMsg.setAttribute('id', idPrefix + newMsg.id);
        newMsg.setAttribute('mid', newMsg.id);
    } else {
        pin.setAttribute('id', 'pin-' + newMsg.id);
        msgReactParent.setAttribute('id', 'actions-' + newMsg.id)
    }

    const channelId = localStorage.getItem('currChannel');

    // msg react
    actionEle.push(createMsgActionIcon(msgReactParent, 'bi-emoji-sunglasses', 'react'));

    const reactEles = [];
    const reactIds = ['reaction-sunglasses', 'reaction-ghost', 'reaction-face'];

    reactEles.push(cloneAndAppendReaction(msgReactParent, reactIds[0]));
    reactEles.push(cloneAndAppendReaction(msgReactParent, reactIds[1]));
    reactEles.push(cloneAndAppendReaction(msgReactParent, reactIds[2]));
    const close = createMsgActionIcon(msgReactParent, 'bi-x', 'reaction-close');
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
            // TODO: CHECK THIS TO BE RIGHT!!!
            userProfilePic.src = data.image;
            // fileToDataUrl(data.image)
            //     .then(data => msgProfileHtml.src = data.image)
            //     .catch(data => loadError(data));    
        }
    })

    if (msg.edited) {
        setTime(newMsg, msg.editedAt);
        showEditedStatus(newMsg);
    } else {
        setTime(newMsg, msg.sentAt);
    }

    // TODO: for pinned, change this to a parameter?

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

// reset the message body to be empty
export const resetMsgBody = () => {
    const chatBody =  document.getElementById('chat-box-body');
    removeAllChild(chatBody);
    document.getElementById('msg-input').value = '';
    localStorage.setItem('msgStart', '0');
    localStorage.setItem('lastScrollTop', '0');
}

// process either all messages fetch or just individual messages
const processMsges = (msgArr) => {
    let msgStart = parseInt(localStorage.getItem('msgStart'));
    if (msgArr.length > 0) {
        msgStart += 25;
        localStorage.setItem('msgStart', msgStart.toString());
    } 
    msgArr.forEach(msg => displayMsg(msg, true, document.getElementById('chat-box-body')));
}

// reset chat body and get all messages from backend
export const getMsg = (cid) => {
    // fetch messages
    sendRequest({
        route: '/message/' + cid + '?start=' + localStorage.getItem('msgStart'),
        method: 'GET',
        token: localStorage.getItem('token') 
    })
    .then(data => processMsges(data.messages))
    .catch(data => loadError(data));
}



const msgInput = document.getElementById('msg-input');
const sendMsgBtn = document.getElementById('send-msg-btn');
msgInput.addEventListener('keyup', () => {

    if(msgInput.value || msgInput.value.trim().length !== 0) {
        sendMsgBtn.classList.remove('disabled');
    } else {
        sendMsgBtn.classList.add('disabled');
    }
})

const getSingleMsg = (cid, index) => {
    // fetch messages
    sendRequest({
        route: '/message/' + cid + '?start=' + 0,
        method: 'GET',
        token: localStorage.getItem('token') 
    })
    .then(data => {
        displayMsg(data.messages[index], false, document.getElementById('chat-box-body'));
    })
    .catch(data => loadError(data));
}

// send message event
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
        // successfully send
        // add message to current chat box
        getSingleMsg(currChannel, 0);
    }).catch(data => loadError(data));
});

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
        // loading and fetching
        // TODO: fetching done, now loading
        getMsg(localStorage.getItem('currChannel'));
    }
}

// show all pinned messages
const showPinBtn = document.getElementById('pinned-msg-btn');
// get modal TODO
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
    // fuck, same functionality... meaning using display messages function? does it  work? 
})
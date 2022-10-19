import { loadError } from "./error.js";
import { sendRequest } from "./requests.js";
import { cloneDiv, parseDate, fileToDataUrl } from "./helpers.js";

// 19/10 TODO for tmrw:
// backwards adding messages is wrong, correct this please


let msgStart = 0;

// display a message send by authorised user
const setSenderMsg = (senderEle) => {
    senderEle.classList.add('senderName');
}


// display a message in the chat
const displayMsg = (msg, appendStart) => {
    // clone the message template
    const newMsg = cloneDiv('msg-template', `${msg.id}`);

    // Also want:
    // distinguish between authorised user and other user
    const senderUid = msg.sender;

    // sender details (name, profile pic)
    // images of message

    // get all required html fields
    const msgProfileHtml = newMsg.children[0];
    const msgSenderHtml = newMsg.children[1].children[0].children[0];
    if (senderUid.toString() === localStorage.getItem('userId')) {
        setSenderMsg(msgSenderHtml);
    }

    // get sender information
    sendRequest({
        route: '/user/' + senderUid,
        method: 'GET',
        token: localStorage.getItem('token')
    }).then(data => {
        msgSenderHtml.innerText = data.name;
        if (data.image) {
            // TODO: CHECK THIS TO BE RIGHT!!!
            msgProfileHtml.src = data.image;
            // fileToDataUrl(data.image)
            //     .then(data => msgProfileHtml.src = data.image)
            //     .catch(data => loadError(data));    
        }
    })

    const msgTimeHtml = newMsg.children[1].children[0].children[1];
    const dates = parseDate(msg.sentAt);
    const msgBodyHtml = newMsg.children[1].children[1];
    // set information on each html fields
    msgBodyHtml.innerText = msg.message;
    msgTimeHtml.innerText = dates;

    const chatBox = document.getElementById('chat-box-body');

    console.log(appendStart);
    // append new messages to the start of chat 
    if (appendStart) {
        console.log('true');
        const firstChild = chatBox.firstChild;
        chatBox.insertBefore(newMsg, firstChild);
    }
    else {
        chatBox.appendChild(newMsg);
    }
}

// reset the message body to be empty
export const resetMsgBody = () => {
    const chatBody =  document.getElementById('chat-box-body');
    while (chatBody.firstChild) {
        chatBody.removeChild(chatBody.lastChild);
    }
    document.getElementById('msg-input').value = '';
    localStorage.setItem('start', '0');
}

// process either all messages fetch or just individual messages
const processMsges = (msgArr) => {
    if (msgArr.length > 0) {
        msgStart += 25;
    }
    msgArr.forEach(msg => displayMsg(msg, true));
}

// reset chat body and get all messages from backend
export const getMsg = (cid) => {
    // fetch messages
    sendRequest({
        route: '/message/' + cid + '?start=' + msgStart,
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
        // const msgArr = data.messages.reverse();
        console.log(data.messages[index])
        displayMsg(data.messages[index]);
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
ç
const element = document.getElementById('chat-box-parent');
let lastScrollTop = 0;
element.onscroll = (e)=>{
    const scrollContainer = document.getElementById('chat-box-body');
    let adjusted = element.scrollTop * -1;
    if (adjusted < lastScrollTop){
        // upscroll 
        return;
    } 

    lastScrollTop = adjusted <= 0 ? 0 : adjusted;
    
    if (adjusted + element.offsetHeight>= scrollContainer.scrollHeight){
        // loading and fetching
        // TODO: fetching done, now loading
        getMsg(localStorage.getItem('currChannel'));
    }
}
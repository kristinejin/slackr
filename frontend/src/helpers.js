/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
    const valid = validFileTypes.find(type => type === file.type);
    // Bad data, let's walk away.
    if (!valid) {
        throw Error('provided file is not a png, jpg or jpeg image.');
    }
    
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve,reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
}



export function isLoggedIn() {
    const token = localStorage.getItem('token');
    return (token) ? token : false;
}


export const cloneDiv = (htmlid, id) => {
    const newDiv = document.getElementById(htmlid).cloneNode(true);
    if (!id) {
        newDiv.removeAttribute('id');
    } else {
        newDiv.setAttribute('id', id);
    }
    newDiv.classList.remove('hide');
    return newDiv;
}

export const removeAllChild = (ele) => {
    while(ele.firstChild) {
        ele.removeChild(ele.lastChild);
    }
}

// parse ios date string to a user friendly format 
export const parseDate = (iso) => {
    const date = new Date(iso);
    const now = Date.now();
    const elapsed = now - date; // elapsed time in milliseconds
    const elapsedInMins = elapsed/60000;
    const elapsedInHour = elapsed/60000;
    if (elapsedInMins < 60) {
        return `${elapsedInMins | 0} mins ago`;
    }
    else if (elapsedInHour < 24) {
        if (elapsedInHour | 0 === 1) {
            return `${elapsedInHour | 0} hour ago`;
        }
        return `${elapsedInHour | 0} hours ago`;
    }
    const dates = [date.getDate(), date.getMonth(), date.getFullYear()];
    return `${dates[0]}/${dates[1]}/${dates[2]}`
}

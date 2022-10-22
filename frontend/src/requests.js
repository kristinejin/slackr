export function sendRequest({route, method, body, token}) {
    const options = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        method: method,
    }
    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }
    return new Promise((resolve, reject) => {
        fetch("http://localhost:5005" + route, options)
        .then(res => {
            return res.json();
        })
        .then(data => {
            if (data.error) {
                reject(data.error);
            }
            else {
                resolve(data);
            }
        })
        .catch(data => reject(data));
    });
}

export function sendRequestRaw({route, method, body, token}) {
    const options = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        method: method,
    }
    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }
    return fetch("http://localhost:5005" + route, options).then(res => {
        return res.json();
    });
}
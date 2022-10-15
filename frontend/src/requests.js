export function sendRequest(route, method, body) {
    console.log(route);
    return new Promise((resolve, reject) => {
        fetch(
            "http://localhost:5005" + route, {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify(body),
        }).then((res) => {
            return res.json();
        }).then((data) => {
            if (data.error) {
                alert(data.error);
            }
            else {
                resolve(data);
            }
        }).catch(() => console.log("error"));
    });
}
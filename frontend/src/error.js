export function errors(errorMeg) {
    const errPage = document.getElementById('error-popup');
    const errMsg = document.getElementById('err-msg');
    errMsg.value = errorMeg;
    errPage.style.display = 'block';
}
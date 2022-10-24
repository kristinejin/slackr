/*
    Loads error message in a modal
*/

export const loadError = (msg) => {
    document.getElementById('error-body').textContent = msg;
    const myModal = new bootstrap.Modal('#error-popup');
    myModal.show();
}

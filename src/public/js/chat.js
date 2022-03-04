// import Toastify from 'toastify-js';

let btnAddToastMessage = document.querySelector("#addToastMessage");
btnAddToastMessage.addEventListener("click", ()=> {

    Toastify({
        text: "채팅입니다.",
        duration: 1500,
        destination: "",
        newWindow: true,
        close: false,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        onClick: function(){console.log(this)} // Callback after click
      }).showToast();
    
      Toastify({
        text: "채팅입니다2",
        duration: 1500,
        destination: "",
        newWindow: true,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        onClick: function(){console.log(this)} // Callback after click
      }).showToast();
})

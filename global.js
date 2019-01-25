(function() {
  // create modal function
  var content = document.createElement("p");
  content.className = "content";

  var close = document.createElement("span");
  close.className = "close";
  close.innerHTML = "&times;";

  var contentDiv = document.createElement("div");
  contentDiv.className = "modal-content";
  contentDiv.appendChild(close); 
  contentDiv.appendChild(content);


  var modal = document.createElement("div");
  modal.id = "ModalWin";
  modal.className = "modal";
  
  modal.appendChild(contentDiv);                     
  document.body.appendChild(modal); 
})();

function showModal(html) {
  document.querySelector('#ModalWin > div > p').innerHTML = html;  
  document.querySelector('#ModalWin').style.display = 'block';
}

function dismissModal() {
  document.querySelector('#ModalWin').style.display = 'none';
}
const toolsCont = document.querySelector(".tools-cont");
const optionsCont = document.querySelector(".options-cont");
let optionsFlag = true;
const pencilToolCont = document.querySelector(".pencil-tool-cont");
const eraserToolCont = document.querySelector(".eraser-tool-cont");
const pencil = document.querySelector(".pencil");
const eraser = document.querySelector(".eraser");
const sticky = document.querySelector(".sticky");
const upload = document.querySelector(".upload");
let pencilFlag = false;
let eraserFlag = false;

optionsCont.addEventListener("click", (e) => {
  // true -> tools show, false -> hide tools
  optionsFlag = !optionsFlag;

  if (optionsFlag) openTools();
  else closeTools();
});

function openTools() {
  const iconElem = optionsCont.children[0];
  iconElem.classList.remove("fa-times");
  iconElem.classList.add("fa-bars");
  toolsCont.style.display = "flex";
}
function closeTools() {
  const iconElem = optionsCont.children[0];
  iconElem.classList.remove("fa-bars");
  iconElem.classList.add("fa-times");
  toolsCont.style.display = "none";

  pencilToolCont.style.display = "none";
  eraserToolCont.style.display = "none";
}

pencil.addEventListener("click", (e) => {
  // true -> show pencil tool, false -> hide pencil tool
  pencilFlag = !pencilFlag;

  if (pencilFlag) pencilToolCont.style.display = "block";
  else pencilToolCont.style.display = "none";
});

eraser.addEventListener("click", (e) => {
  // true -> show eraser tool, false -> hide eraser tool
  // eraserFlag = !eraserFlag;

  if (eraserToolCont.style.display === "flex") {
    eraserFlag = false;
    eraserToolCont.style.display = "none";
  } else {
    eraserFlag = true;
    eraserToolCont.style.display = "flex";
  }
});

upload.addEventListener("click", (e) => {
  // Open file explorer
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.click();

  input.addEventListener("change", (e) => {
    const file = input.files[0];
    const url = URL.createObjectURL(file);

    const stickyTemplateHTML = `
        <div class="header-cont">
            <div class="minimize"></div>
            <div class="remove"></div>
        </div>
        <div class="note-cont">
            <img src="${url}"/>
        </div>
        `;
    createSticky(stickyTemplateHTML);
  });
});

sticky.addEventListener("click", (e) => {
  const stickyTemplateHTML = `
    <div class="header-cont">
        <div class="minimize"></div>
        <div class="remove"></div>
    </div>
    <div class="note-cont">
        <textarea spellcheck="false"></textarea>
    </div>
    `;

  createSticky(stickyTemplateHTML);
});

function createSticky(stickyTemplateHTML) {
  const stickyCont = document.createElement("div");
  stickyCont.setAttribute("class", "sticky-cont");
  stickyCont.innerHTML = stickyTemplateHTML;
  document.body.appendChild(stickyCont);

  const minimize = stickyCont.querySelector(".minimize");
  const remove = stickyCont.querySelector(".remove");
  noteActions(minimize, remove, stickyCont);

  stickyCont.onmousedown = function (event) {
    dragAndDrop(stickyCont, event);
  };

  stickyCont.ondragstart = function () {
    return false;
  };
}

function noteActions(minimize, remove, stickyCont) {
  remove.addEventListener("click", (e) => {
    stickyCont.remove();
  });
  minimize.addEventListener("click", (e) => {
    const noteCont = stickyCont.querySelector(".note-cont");
    const display = getComputedStyle(noteCont).getPropertyValue("display");
    if (display === "none") noteCont.style.display = "block";
    else noteCont.style.display = "none";
  });
}

function dragAndDrop(element, event) {
  const shiftX = event.clientX - element.getBoundingClientRect().left;
  const shiftY = event.clientY - element.getBoundingClientRect().top;

  element.style.position = "absolute";
  element.style.zIndex = 1000;

  moveAt(event.pageX, event.pageY);

  // moves the container at (pageX, pageY) coordinates
  // taking initial shifts into account
  function moveAt(pageX, pageY) {
    element.style.left = pageX - shiftX + "px";
    element.style.top = pageY - shiftY + "px";
  }

  function onMouseMove(event) {
    moveAt(event.pageX, event.pageY);
  }

  // move the container on mousemove
  document.addEventListener("mousemove", onMouseMove);

  // drop the container, remove unneeded handlers
  element.onmouseup = function () {
    document.removeEventListener("mousemove", onMouseMove);
    element.onmouseup = null;
  };
}

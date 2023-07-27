const boardUrl = window.location.pathname.substring(1);
fetch("http://localhost:3001/state/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ boardUrl }),
})
  .then((res) => {
    return res.json();
  })
  .then((data) => {
    undoRedoCanvas({
      trackValue: parseInt(data.track),
      trackArray: data.undoRedoCanvas,
    });
  })
  .catch((err) => {
    console.error(err);
  });

const canvas = document.querySelector("canvas");

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
let mousedown = false;

const pencilColors = document.querySelectorAll(".pencil-color");
const pencilWidthElem = document.querySelector(".pencil-width");
const eraserWidthElem = document.querySelector(".eraser-width");
const download = document.querySelector(".download");
const redo = document.querySelector(".redo");
const undo = document.querySelector(".undo");

let penColor = "red";
const eraserColor = "white";
let penWidth = pencilWidthElem.value;
let eraserWidth = eraserWidthElem.value;

let undoRedoTracker = []; //Data
let track = -1; // Represent which action from tracker array

const tool = canvas.getContext("2d");

tool.strokeStyle = penColor;
tool.lineWidth = "3";

canvas.addEventListener("mousedown", (event) => {
  mousedown = true;
  const data = {
    x: event.clientX,
    y: event.clientY,
    color: eraserFlag ? eraserColor : penColor,
    width: eraserFlag ? eraserWidth : penWidth,
    boardUrl,
  };
  socket.emit("begin-path", data);
});

canvas.addEventListener("mousemove", (event) => {
  if (mousedown) {
    const data = { x: event.clientX, y: event.clientY, boardUrl };
    socket.emit("draw-stroke", data);
  }
});

function drawStroke({ x, y }) {
  tool.lineTo(x, y);
  tool.stroke();
}

function beginPath({ x, y, color, width }) {
  tool.strokeStyle = color;
  tool.lineWidth = width;
  drawDot(x, y);
  tool.beginPath();
  tool.moveTo(x, y);
}

function drawDot(x, y) {
  tool.beginPath();
  tool.arc(x, y, tool.lineWidth / 2, 0, 2 * Math.PI);
  tool.fillStyle = tool.strokeStyle;
  tool.fill();
}

pencilColors.forEach((colorElement) => {
  colorElement.addEventListener("click", () => {
    eraserFlag = false;
    const color = colorElement.classList[0];
    penColor = color;
    tool.strokeStyle = penColor;
    tool.lineWidth = penWidth;
  });
});

pencilWidthElem.addEventListener("change", (e) => {
  eraserFlag = false;
  penWidth = pencilWidthElem.value;
  tool.lineWidth = penWidth;
  tool.strokeStyle = penColor;
});
eraserWidthElem.addEventListener("change", (e) => {
  eraserFlag = true;
  eraserWidth = eraserWidthElem.value;
  tool.lineWidth = eraserWidth;
  tool.strokeStyle = eraserColor;
});

eraser.addEventListener("click", (e) => {
  if (eraserFlag) {
    tool.strokeStyle = eraserColor;
    tool.lineWidth = eraserWidth;
  } else {
    tool.strokeStyle = penColor;
    tool.lineWidth = penWidth;
  }
});

download.addEventListener("click", (event) => {
  const url = canvas.toDataURL();
  const a = document.createElement("a");
  a.href = url;
  a.download = "board.jpg";
  a.click();
});

canvas.addEventListener("mouseup", (event) => {
  mousedown = false;
  const url = canvas.toDataURL();
  undoRedoTracker.push(url);
  track = undoRedoTracker.length - 1;
  try {
    socket.emit("stateChange", {
      boardUrl,
      track,
      undoRedoTracker,
    });
  } catch (err) {
    console.log(err);
  }
});

undo.addEventListener("click", (event) => {
  if (track >= 0) {
    track--;
    const data = {
      trackValue: track,
      trackArray: undoRedoTracker,
      boardUrl,
    };
    socket.emit("redoUndo", data);
    // undoRedoCanvas();
  }
});

redo.addEventListener("click", (event) => {
  if (track < undoRedoTracker.length - 1) {
    track++;
    const data = {
      trackValue: track,
      trackArray: undoRedoTracker,
      boardUrl,
    };
    socket.emit("redoUndo", data);
    // undoRedoCanvas();
  }
});

function undoRedoCanvas({ trackValue, trackArray }) {
  //   console.log(undoRedoTracker, track);
  track = trackValue;
  undoRedoTracker = trackArray;
  tool.clearRect(0, 0, canvas.width, canvas.height);
  if (track === -1) return;
  const url = undoRedoTracker[track];
  const img = new Image();
  img.src = url;
  img.onload = (event) => {
    // console.log(img);
    tool.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
}

socket.on("begin-path", (data) => {
  if (data.boardUrl === boardUrl) beginPath(data);
});

socket.on("draw-stroke", (data) => {
  if (data.boardUrl === boardUrl) drawStroke(data);
});

socket.on("redoUndo", (data) => {
  if (data.boardUrl === boardUrl) undoRedoCanvas(data);
});

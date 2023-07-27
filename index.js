const express = require("express");
const socket = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const mongoose = require("mongoose");
const CanvasModel = require("./models/CanvasModel");
const bodyParser = require("body-parser");

// console.log(socket);

const app = express(); // initialized and server ready

app.use(bodyParser.json({ limit: "50mb" }));

app.use(express.static(path.join(__dirname, "./Public/Canvas")));

app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "./Public/Home/index.html");
  res.sendFile(filePath);
});

app.post("/create-canvas", async (req, res) => {
  const canvasId = uuidv4();
  const canvasData = new CanvasModel({
    boardUrl: canvasId,
    track: 0,
    undoRedoCanvas: [],
  });
  await canvasData.save();
  // Store the new canvas ID in canvasStates (you can also initialize a new canvas state here)
  res.json(canvasId);
});

app.post("/state", async (req, res) => {
  try {
    const existingCanvasData = await CanvasModel.findOne({
      boardUrl: req.body.boardUrl,
    });

    if (!existingCanvasData) {
      return res.status(404).json({ error: "Canvas data not found" });
    }

    res.json(existingCanvasData);
  } catch (err) {
    console.error(err);
  }
});

app.get("/:canvasId", async (req, res) => {
  const existingCanvasData = await CanvasModel.findOne({
    boardUrl: req.params.canvasId,
  });
  if (!existingCanvasData) {
    return res.status(404).json({ error: "Board not found" });
  }
  res.sendFile(path.join(__dirname, "./Public/Canvas/canvas.html"));
});

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const server = app.listen(3001, () => {
      console.log("server is listening at port 3001");
    });

    const io = socket(server);

    io.on("connection", (socket) => {
      socket.on("begin-path", (data) => {
        // transfer data to all connetcted computers
        io.sockets.emit("begin-path", data);
      });

      socket.on("draw-stroke", (data) => {
        io.sockets.emit("draw-stroke", data);
      });

      socket.on("redoUndo", (data) => {
        io.sockets.emit("redoUndo", data);
        updateCanvas({
          boardUrl: data.boardUrl,
          track: data.trackValue,
          undoRedoTracker: data.trackArray,
        });
      });

      socket.on("stateChange", (data) => {
        updateCanvas(data);
      });

      socket.on("disconnect", () => {
        // console.log(io.engine.clientsCount);
        if (io.engine.clientsCount == 0) {
          state = null;
        }
      });
    });
  });

async function updateCanvas(data) {
  try {
    const existingCanvasData = await CanvasModel.findOne({
      boardUrl: data.boardUrl,
    });

    if (!existingCanvasData) {
      throw new Error("Canvas data not found");
    }

    // Update the document with new data
    // existingCanvasData.track = data.track;
    // existingCanvasData.undoRedoCanvas = data.undoRedoTracker;

    // Save the updated document to the database
    await existingCanvasData.updateOne({
      boardUrl: data.boardUrl,
      track: data.track,
      undoRedoCanvas: data.undoRedoTracker,
    });

    return true; // Indicate success if needed
  } catch (err) {
    // Handle the error appropriately (e.g., log, return an error response, etc.)
    console.error(err);
    return false; // Indicate failure if needed
  }
}

// canvasModel.js
const mongoose = require("mongoose");

const canvasSchema = new mongoose.Schema({
  boardUrl: {
    type: String,
    required: true,
  },
  track: {
    type: String,
    required: true,
  },
  undoRedoCanvas: {
    type: Array,
    required: true,
  },
});

const CanvasModel = mongoose.model("Canvas", canvasSchema);

module.exports = CanvasModel;

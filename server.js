const mongoose = require('mongoose');
const Document = require("./Document");

mongoose.connect("mongodb://localhost/my_database", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((e) => {
  console.log("MongoDB connection error:", e.message);
});

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("get-document", async (documentId) => {
    try {
      const document = await findOrCreateDocument(documentId);
      socket.join(documentId);
      socket.emit("load-document", document?.data);

      socket.on("send-changes", (delta) => {
        socket.broadcast.to(documentId).emit("receive-changes", delta);
      });

      socket.on("save-document", async (data) => {
        try {
          await Document.findByIdAndUpdate(documentId, { data });
        } catch (error) {
          console.error("Error saving document:", error);
        }
      });
    } catch (error) {
      console.error("Error finding or creating document:", error);
    }
  });
});
//comment

async function findOrCreateDocument(id) {
  if (id == null) return null;

  const document = await Document.findById(id);
  if (document) return document;

  return await Document.create({ _id: id, data: defaultValue });
}

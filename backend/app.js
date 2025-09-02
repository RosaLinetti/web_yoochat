require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json());


app.use(cors({
  origin: "http://localhost:3001",  // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

const routes = require("./routes/routes");
app.use("/", routes);

app.get("/", (req, res) => {
  res.send("YoChat API is running!");
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

require("./sockets/chat")(io);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
var methodOverride = require("method-override");
dotenv.config();

// MONGO_URI=mongodb+srv://rekhav:rekhav123@cluster0.fj0hh.mongodb.net/appointment?retryWrites=true&w=majority

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connected...");
  });

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname));

app.use(express.json());
app.use(express.urlencoded());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(methodOverride("_method"));

app.use(function(req,res,next){
  res.locals.currentUser=req.user;
  next();
});

app.use("/", require("./routes/index"));
// app.use('/doctor', require('./routes/doctor'));

app.listen(port, () => {
  console.log("You are listening on port 3000");
});

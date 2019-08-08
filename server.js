const path = require("path");
require("dotenv/config");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const indexRouter = require("./routes/index");
const userRouter = require("./routes/user");

const app = express();
app.use(helmet());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use("/", indexRouter);
app.use("/user", userRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

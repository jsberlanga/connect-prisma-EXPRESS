const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { prisma } = require("../generated/prisma-client");
const jwt = require("jsonwebtoken");

const request = require("request");

const apiKey = `?api_key=${process.env.MOVIEAPI}`;
const moviedbUrl = "https://api.themoviedb.org/3/movie/";
const imageBaseUrl = "http://image.tmdb.org/t/p/w300";

router.use((req, res, next) => {
  res.locals.imageBaseUrl = imageBaseUrl;
  next();
});

router.use((req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const {
      user: { id }
    } = jwt.verify(token, process.env.JWTSECRET);
    req.userId = id;
  }
  next();
});

router.use(async (req, res, next) => {
  if (req.userId) {
    const user = await prisma.user({ id: req.userId });
    delete user.password;
    req.user = user;
  }
  next();
});

router.get("/", (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
  } else {
    const nowPlayingUrl = `${moviedbUrl}now_playing${apiKey}`;
    request.get(nowPlayingUrl, (error, response, body) => {
      const parsedResults = JSON.parse(body);
      res.render("index", {
        results: parsedResults.results.slice(0, 10),
        title: "Now Playing in Cinemas",
        user: req.user.name
      });
    });
  }
});

router.get("/login", (req, res, next) => {
  if (!req.user) {
    res.render("login");
  } else {
    res.render("login", {
      errorMessage: "You are already login. Logout first"
    });
  }
});

router.post("/process_login", async (req, res, next) => {
  const { name, password } = req.body;

  const user = await prisma.user({ name });
  if (!user) {
    res.render("login", {
      loginError: "Ops! This user was not found."
    });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);

  if (!passwordMatch) {
    res.render("login", {
      loginError: "Ops! This combination user/password is incorrect."
    });
  } else {
    const expiresIn = 24 * 60 * 60;
    const accessToken = jwt.sign({ user }, process.env.JWTSECRET, {
      expiresIn: expiresIn
    });

    res.cookie("token", accessToken);
    res.redirect("/");
  }
});

router.post("/process_register", async (req, res, next) => {
  const { name, password } = req.body;

  const hash = bcrypt.hashSync(password, 10);

  const user = await prisma.user({ name });
  if (user) {
    res.render("login", {
      userFound: "Ops! This user is already registered."
    });
  } else {
    const user = await prisma.createUser({ name, password: hash });

    const expiresIn = 24 * 60 * 60;
    const accessToken = jwt.sign({ user }, process.env.JWTSECRET, {
      expiresIn: expiresIn
    });

    res.cookie("token", accessToken);
    res.redirect("/");
  }
});

router.get("/logout", (req, res, next) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;

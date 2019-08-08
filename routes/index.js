const express = require("express");
const router = express.Router();
const { prisma } = require("../generated/prisma-client");

const request = require("request");

const apiKey = `?api_key=${process.env.MOVIEAPI}`;
const moviedbUrl = "https://api.themoviedb.org/3/movie/";
const imageBaseUrl = "http://image.tmdb.org/t/p/w300";

router.use((req, res, next) => {
  res.locals.imageBaseUrl = imageBaseUrl;
  next();
});

router.get("/", (req, res, next) => {
  if (!req.cookies.username) {
    res.redirect("/login");
  } else {
    const nowPlayingUrl = `${moviedbUrl}now_playing${apiKey}`;
    request.get(nowPlayingUrl, (error, response, body) => {
      const parsedResults = JSON.parse(body);
      res.render("index", {
        results: parsedResults.results.slice(0, 10),
        title: "Now Playing in Cinemas",
        user: req.cookies.username
      });
    });
  }
});

router.get("/login", (req, res, next) => {
  if (!req.cookies.username) {
    res.render("login");
  } else {
    res.render("login", {
      errorMessage: "You are already login. Logout first"
    });
  }
});

router.post("/process_login", async (req, res, next) => {
  const { username } = req.body;
  const user = await prisma.users({ where: { name: username } });
  if (user.length) {
    res.cookie("username", username);
    res.redirect("/");
  } else {
    res.render("login", { userNotFound: "Ops! This user was not found." });
  }
});

router.post("/process_register", async (req, res, next) => {
  const { username } = req.body;
  const user = await prisma.users({ where: { name: username } });
  console.log(user);
  if (user.length) {
    res.render("login", {
      userFound: "Ops! This user is already registered."
    });
  } else {
    const newUser = await prisma.createUser({ name: username });

    res.cookie("username", username);
    res.redirect("/");
  }
});

router.get("/logout", (req, res, next) => {
  res.clearCookie("username");
  res.redirect("/");
});

module.exports = router;

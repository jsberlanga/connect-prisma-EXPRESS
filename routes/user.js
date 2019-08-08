const express = require("express");
const router = express.Router();
const { prisma } = require("../generated/prisma-client");

router.get("/", async (req, res, next) => {
  const users = await prisma.users();
  res.json(users);
});

module.exports = router;

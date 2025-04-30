const express = require('express');
const router = express.Router();
const {codeCompiler} = require("../controllers/compilerController")

router.route("/").post(codeCompiler);

module.exports = router
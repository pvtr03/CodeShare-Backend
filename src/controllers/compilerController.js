const asyncHandler = require("express-async-handler");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const codeCompiler = asyncHandler(async (req, res) => {
    const { code, input } = req.body;

    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    const timestamp = Date.now();
    const fileName = `code_${timestamp}.cpp`;
    const executableName = `output_${timestamp}`;
    const inputFileName = `input_${timestamp}.txt`;
    const outputFileName = `output_${timestamp}.txt`;

    const filePath = path.join(__dirname, fileName);
    const inputFilePath = path.join(__dirname, inputFileName);
    const outputFilePath = path.join(__dirname, outputFileName);

    let compilerWarnings = "";

    try {
        fs.writeFileSync(filePath, code);
        if (input) {
            fs.writeFileSync(inputFilePath, input);
        }
        await new Promise((resolve, reject) => {
            exec(`g++ ${filePath} -o ${executableName}`, (err, stdout, stderr) => {
                if (err) {
                    return reject(stderr);
                }
                if (stderr) {
                    compilerWarnings = stderr;
                }
                resolve();
            });
        });

        const startTime = Date.now();
        await new Promise((resolve, reject) => {
            const runCommand = input
                ? `gtimeout 5s ./${executableName} < ${inputFilePath} > ${outputFilePath}`
                : `gtimeout 5s ./${executableName} > ${outputFilePath}`;

            exec(runCommand, (err, stdout, stderr) => {
                if (err) {
                    if (err.code === 124) {
                        return reject("Time Limit Exceeded");
                    }
                    return reject(stderr || err.message);
                }
                resolve();
            });
        });

        const endTime = Date.now();
        const executionTime = (endTime - startTime) / 1000;
        const output = fs.readFileSync(outputFilePath, "utf8");

        return res.status(200).json({
            output,
            executionTime,
            warnings: compilerWarnings ? compilerWarnings.replace(/.*code_\d+\.cpp:/g, "code.cpp:") : null
        });

    } catch (error) {
        let cleanError = error.toString().replace(/.*code_\d+\.cpp:/g, "code.cpp:");
        return res.status(400).json({ error: cleanError });

    } finally {
        [filePath, inputFilePath, outputFilePath, executableName].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    }
});

module.exports = { codeCompiler };

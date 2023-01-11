import express from "express";
import client from "ssh2-sftp-client";
import { writeFileSync } from "fs";
// import { readFile } from "fs/promises";

const sftp = new client();
const app = express();

app.use(express.json());

const fileParts = [];

app.get("/", (req, res) => {
	res.send("CVS Elegibility File API");
});

app.get("/api/elegibilityFile", (req, res) => {
	res.send(fileParts);
});

app.post("/api/elegibilityFile/part", (req, res) => {
	const elegibilityFilePart = {
		index: fileParts.filter((a) => a.fileId == req.body.fileId).length + 1,
		fileId: req.body.fileId,
		content: req.body.content,
	};
	fileParts.push(elegibilityFilePart);
	res.send("Recieved Successfully");
});

app.post("/api/elegibilityFile/sendFile", async (req, res) => {
	const promise1 = new Promise((resolve, reject) => {
		resolve(
			mergeFile({
				fileId: req.body.fileId,
				fileName: req.body.fileName,
			})
		);
	});

	promise1.then((value) => {
		try {
			sendFile({
				host: req.body.host,
				username: req.body.username,
				password: req.body.password,
				port: req.body.port,
				path: req.body.path + "/" + req.body.fileName,
				file: value,
			});
			res.send("Recieved Successfully");
		} catch (e) {
			res.send("Error: " + e.message);
		}
	});
});

const port = process.env.PORT || 80;
app.listen(port, () => console.log(`listening on port ${port}`));

function mergeFile({ fileId: fileId, fileName: fileName }) {
	return createFile({
		fileName: fileName,
		content: fileParts
			.filter((a) => a.fileId == fileId)
			.map((a) => a.content)
			.join(""),
	});
}

function sendFile({
	host: host,
	username: username,
	password: password,
	port: port,
	path: path,
	file: file,
}) {
	const putConfig = {
		flags: "w", // w - write and a - append
		encoding: null, // use null for binary files
		mode: 77777, // mode to use for created file (rwx)
		autoClose: true, // automatically close the write stream when finished
	};
	sftp
		.connect({
			host: host,
			port: port,
			username: username,
			password: password,
		})
		.then(() => {
			sftp.fastPut(file, path, putConfig);
			sftp.end();
		})
		.catch((err) => {
			console.log(err, "catch error");
		});
}

function createFile({ fileName: fileName, content: content }) {
	// readFileSync.createWriteStream("/tmp/file.txt", "Hey there!");
	writeFileSync("temp/" + fileName, content);
}

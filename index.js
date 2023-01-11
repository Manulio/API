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
		name: req.body.content,
	};
	fileParts.push(elegibilityFilePart);
	res.send("Recieved Successfully");
});

app.post("/api/elegibilityFile/sendFile", (req, res) => {
	sendFile({
		host: req.body.host,
		username: req.body.username,
		password: req.body.password,
		port: req.body.port,
		path: req.body.path,
		file: mergeFile({
			fileId: req.body.fileId,
			fileName: req.body.fileName,
		}),
	});
	res.send("Recieved Successfully");
});

const port = process.env.PORT || 80;
app.listen(port, () => console.log(`listening on port ${port}`));

function mergeFile({ fileId: fileId, fileName: fileName }) {
	return createFile({
		fileName: fileName,
		content: fileParts.filter((a) => a.fileId == fileId).join(),
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
	sftp
		.connect({
			host: host,
			port: port,
			username: username,
			password: password,
		})
		.then(() => {
			sftp.put(file, path);
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

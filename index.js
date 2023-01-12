import express from "express";
import client from "ssh2-sftp-client";
import { writeFileSync, readFileSync, unlink } from "fs";

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

app.post("/api/elegibilityFile/sendFile", (req, res) => {
	sendFileHandler({
		connection: {
			host: req.body.host,
			username: req.body.username,
			password: req.body.password,
			port: req.body.port,
			path: req.body.path + "/" + req.body.fileName,
		},
		fileId: req.body.fileId,
		fileName: req.body.fileName,
	});
	res.send("Recieved Successfully");
});

const port = process.env.PORT || 80;
app.listen(port, () => console.log(`listening on port ${port}`));

function sendFileHandler({
	connection: connection,
	fileId: fileId,
	fileName: fileName,
}) {
	writeFileSync(
		"temp/" + fileName + fileId,
		fileParts
			.filter((a) => a.fileId == fileId)
			.map((a) => a.content)
			.join("")
	);

	sftp
		.connect({
			host: connection.host,
			port: connection.port,
			username: connection.username,
			password: connection.password,
		})
		.then(async () => {
			await sftp.put(`./temp/${fileName}${fileId}`, connection.path, false);
			sftp.end();
			console.log(`Sending file ${fileName}`);
		})
		.finally(() => {
			unlink(`./temp/${fileName}${fileId}`, () => {
				console.log(`Removing file ${fileName}`);
			});
		})
		.catch((err) => {
			console.log(err, "catch error");
		});
}

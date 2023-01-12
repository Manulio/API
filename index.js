import express from "express";
import client from "ssh2-sftp-client";
import { writeFileSync, unlink } from "fs";

const sftp = new client();
const app = express();

const fileParts = [];

app.use(express.json());

app.get("/", (req, res) => {
	res.send("Merge Files API");
});

app.get("/api/merge-files", (req, res) => {
	res.send(fileParts);
});

app.post("/api/merge-files/send-part", (req, res) => {
	const filePart = {
		index: fileParts.filter((a) => a.fileId == req.body.fileId).length + 1,
		fileId: req.body.fileId,
		content: req.body.content,
	};
	fileParts.push(filePart);
	res.send("Recieved Successfully");
});

app.post("/api/merge-files/send-file-sftp", (req, res) => {
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
		res: res,
	});
});

const port = process.env.PORT || 80;
app.listen(port, () => console.log(`listening on port ${port}`));

function sendFileHandler({
	connection: connection,
	fileId: fileId,
	fileName: fileName,
	res: res,
}) {
	writeFileSync(
		"temp/" + fileName + fileId,
		fileParts
			.filter((a) => a.fileId == fileId)
			.map((a) => a.content)
			.join("")
	);
	try {
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
				res.send(true);
			})
			.finally(() => {
				unlink(`./temp/${fileName}${fileId}`, () => {
					console.log(`Removing file ${fileName}`);
				});
			})
			.catch((err) => {
				console.log(err, "catch error");
				res.send(false);
			});
	} catch (e) {
		res.send(false);
	}
}

import express from "express";

const app = express();

app.use(express.json());

const students = [
	{ id: 1, name: "pepe" },
	{ id: 2, name: "jorge" },
];

app.get("/", (req, res) => {
	res.send("CVS api");
});

app.get("/api/students", (req, res) => {
	res.send(students);
});

app.get("/api/students/:id", (req, res) => {
	const student = students.find((c) => c.id === parseInt(req.params.id));
	if (student) {
		res.send(students);
	}
});

app.post("/api/students/", (req, res) => {
	const student = {
		id: students.length + 1,
		name: req.body.name,
	};
	students.push(student);
	res.send(student);
});

const port = process.env.PORT || 80;
app.listen(port, () => console.log(`listening on port ${port}`));

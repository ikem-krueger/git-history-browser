function log(fn, req, res) {
	console.log(`${fn} => request: ${req.method} '${req.url}' => response:\n${JSON.stringify(res, null, 2)}`);
}

const execFile = require('child_process').execFile;
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('client'));

app.get('/', (req, res) => {
	res.send(`http://localhost:${port}/index.html`);
});

app.get('/history', (req, res) => {
	execFile('git', ['-C', path, 'log', '--oneline'], (error, stdout, stderr) => {
		let messages = [];

		const regex = /([a-z0-9]{7}) (.*)/g;

		let lines = stdout.split("\n");

		lines.pop(); // FIXME: last element is empty

		lines.forEach((line) => {
			let result = line.replace(regex, '{ "hash": "$1", "message": "$2" }');
			
			messages.push(JSON.parse(result));
		});

		log("populateCommitHistory()", req, messages);

		res.json(messages);
	});
});

app.get('/tree', (req, res) => {
	// git -C <path> ls-tree -r <commit>
	let files = [
		{ "hash": "8799ad7eade90b481d06fb1703fd6c464210e367", "file": "Links.txt" }, 
		{ "hash": "97219aebe1d4be4c7df577b9f15922610468fa92", "file": "header-link-emperor.css" }, 
		{ "hash": "76815ee992673236b838629a77acbcdb428562c1", "file": "header-link-emperor.js" }, 
		{ "hash": "90687de26d71e91b7c82565772a7df470ae277a6", "file": "icons/header-link-emperor-48.png" }, 
		{ "hash": "a1129b78e86930bda45c7ca18806ffd1bca606ca", "file": "manifest.json" }
	]
	
	log("populateCommitHistory()", req, files);

    res.json(files);
});

app.get('/file', (req, res) => {
    // git -C <path> show <commit>
	let content = ".headerlink {\n    display:none;\n    margin:0 0 0 .2em;\n    text-decoration:none;\n    color:#999;\n}\n\nh1:hover *,\nh2:hover *,\nh3:hover *,\nh4:hover *,\nh5:hover *,\nh6:hover * {\n    display:inline;\n}\n";
	
	log("populateCommitHistory()", req, content); // FIXME

    res.send(content);
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

var path = "C:\\Users\\Marco\\Documents\\Projekte\\git-log-tree-viewer";

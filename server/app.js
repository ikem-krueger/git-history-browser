const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

/*
app.get('/', (req, res) => {
	// TODO: deliver the client part
});
*/

app.get('/history', (req, res) => {
	// git -C <path> log --oneline
	let messages = [
		{ "hash": "c5ac52b", "message": "Fix dash on beginning/end of link" }, 
		{ "hash": "7a2b38e", "message": "Add missing newline" }, 
		{ "hash": "8122f3f", "message": "Add comment" }, 
		{ "hash": "201bcde", "message": "Update logic" }, 
		{ "hash": "cef03b3", "message": "Refactor" }, 
		{ "hash": "8b3edf0", "message": "Add css style for the header links" }, 
		{ "hash": "96aa850", "message": "Add logic for adding header links" }, 
		{ "hash": "b51bfa4", "message": "Fix link" }, 
		{ "hash": "9edf43c", "message": "Change substitution symbol to be more in line with most websites" }, 
		{ "hash": "6761e6d", "message": "Initial commit" }
	]
	
    console.log(`populateCommitHistory() => ${req.method} '${req.url}' =>\n${JSON.stringify(messages, null, 2)}`);
	
    res.json(messages);
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

    console.log(`populateFilesystemTree() => ${req.method} '${req.url}' =>\n${JSON.stringify(files, null, 2)}`);

    res.json(files);
});

app.get('/file', (req, res) => {
    // git -C <path> show <commit>
	let content = ".headerlink {\n    display:none;\n    margin:0 0 0 .2em;\n    text-decoration:none;\n    color:#999;\n}\n\nh1:hover *,\nh2:hover *,\nh3:hover *,\nh4:hover *,\nh5:hover *,\nh6:hover * {\n    display:inline;\n}\n";

    console.log(`populateFileContent() => ${req.method} '${req.url}' =>\n${content}`);

    res.send(content);
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

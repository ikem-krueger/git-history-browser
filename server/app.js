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
        let messages = stdout.replace(/([a-z0-9]{7}) (.*)/g, '{ "hash": "$1", "message": "$2" }, ').replace(/\n/g, ' ').replace(/^/, "[ ").replace(/},  $/, "} ]");

        res.type('json');

        res.send(messages);
    });
});

app.get('/tree', (req, res) => {
	let commit = "468a330";
	
    execFile('git', ['-C', path, 'ls-tree', '-r', commit], (error, stdout, stderr) => {
        let files = stdout.replace(/([0-9]{6}) (blob) ([a-z0-9]{40})\t(.*)/g, '{ "hash": "$3", "file": "$4"}, ').replace(/\n/g, ' ').replace(/^/, "[ ").replace(/},  $/, "} ]");
        
        res.type('json');
        
        res.send(files);
    });
});

app.get('/file', (req, res) => {
	let commit = "1f22b9c26a3d8e65b0d0393dbe20c556a68a6416";
	
	execFile('git', ['-C', path, 'show', commit], (error, stdout, stderr) => {
		let content = stdout;

		res.send(content);
	});
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

var path = "C:\\Users\\Marco\\Documents\\Projekte\\git-log-tree-viewer";

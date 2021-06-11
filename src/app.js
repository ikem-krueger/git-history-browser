const cors = require('cors');
const express = require('express');
const app = express();
const execFile = require('child_process').execFile;

const port = 3000;
const host = `http://localhost:${port}`;

const types = {
    "A": "Added", 
    "C": "Copied", 
    "D": "Deleted", 
    "M": "Modified", 
    "R": "Renamed", 
    "T": "Type", 
    "U": "Unmerged", 
    "X": "Unknown", 
    "B": "Broken"
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.get('/branches', (req, res) => {
    const path = req.query.path;

    execFile('git', ['-C', path, 'branch', '-a'], (error, stdout, stderr) => {
        res.json(stdout.trim().split("\n"));
    });
});

app.get('/commits', (req, res) => {
    const path = req.query.path;
    const branch = req.query.branch;

    execFile('git', ['-C', path, 'log', '--pretty=format:%H|%an <%ae>|%ad|%at|%s', branch], (error, stdout, stderr) => {
        const lines = stdout.split("\n");

        const messages = [];

        lines.forEach((line) => {
            const [ hash, author, date, timestamp, message ] = line.split("|");

            messages.push({ hash: hash, author: author, date: date, timestamp: timestamp, message: message });
        });

        res.json(messages);
    });
});

app.get('/changes', (req, res) => {
    const path = req.query.path;
    const hash = req.query.hash;

    execFile('git', ['-C', path, 'diff', '--name-status', hash + '~1', hash, '--diff-filter=dr', '--no-rename'], (error, stdout, stderr) => { // filter deleted/renamed files
        const lines = stdout.trim().split("\n");

        const files = {};

        lines.forEach((line) => {
            const [status, file] = line.split(/\t/);

            files[file] = types[status];
        });

        res.json(files);
    });
});

app.get('/files', (req, res) => {
    const path = req.query.path;
    const hash = req.query.hash;

    execFile('git', ['-C', path, 'ls-tree', '-r', '-l', hash], (error, stdout, stderr) => {
        const lines = stdout.trim().split("\n");

        const files = [];

        lines.forEach((line) => {
            const [ rest, file ] = line.split("\t");

            const [ mode, type, hash, size ] = rest.split(/ +/);

            files.push({ mode: mode, type: type, hash: hash, size: size, file: file });
        });

        res.json(files);
    });
});

app.get('/content', (req, res) => {
    const path = req.query.path;
    const hash = req.query.hash;

    execFile('git', ['-C', path, 'show', hash], (error, stdout, stderr) => {
        res.send(stdout);
    });
});

app.get('/diff', (req, res) => {
    const path = req.query.path;
    const hash = req.query.hash;
    const file = req.query.file;

    execFile('git', ['-C', path, 'diff', hash + '~1', hash, '--', file], (error, stdout, stderr) => {
        res.send(stdout);
    });
});

app.listen(port, () => {
    console.log(`App listening at ${host}`);
});

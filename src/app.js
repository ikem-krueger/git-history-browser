const cors = require('cors');
const express = require('express');
const app = express();
const spawn = require('child_process').spawn;
const readline  = require('readline');

const port = 3003;
const host = `http://localhost:${port}`;

app.use(cors());
app.use(express.json());
app.use(express.static(process.cwd() + '/public'));

app.get('/branches', (req, res) => {
    const path = req.query.path;

    console.log(`path: '${path}'`);

    const branches = [];

    const proc = spawn('git', ['-C', path, 'branch', '-a']);

    proc.stdout.setEncoding('utf8');

    readline.createInterface({ input: proc.stdout, terminal: false }).on('line', (line) => {
        branches.push(line);
    });

    proc.on('close', (exitCode) => {
        console.log("branches: " + branches.length);

        res.json(branches);
    });
});

app.get('/commits', (req, res) => {
    const path = req.query.path;
    const branch = req.query.branch;

    console.log(`branch: '${branch}'`);

    const commits = [];

    const proc = spawn('git', ['-C', path, 'log', '--pretty=format:%H|%an <%ae>|%ad|%at|%s', branch]);

    proc.stdout.setEncoding('utf8');

    readline.createInterface({ input: proc.stdout, terminal: false }).on('line', (line) => {
        const [ hash, author, date, timestamp, message ] = line.split("|");

        commits.push({ hash: hash, author: author, date: date, timestamp: timestamp, message: message });
    });

    proc.on('close', (exitCode) => {
        console.log("commits: " + commits.length);

        res.json(commits);
    });
});

app.get('/changes', (req, res) => {
    const path = req.query.path;
    const hash = req.query.hash;

    console.log(`commit: ${hash}`);

    const files = {};

    const proc = spawn('git', ['-C', path, 'diff', '--name-status', hash + '~1', hash, '--diff-filter=dr', '--no-rename']); // ignore "delete" and "rename"

    proc.stdout.setEncoding('utf8');

    readline.createInterface({ input: proc.stdout, terminal: false }).on('line', (line) => {
        const types = {
            "A": "Added", 
            "C": "Copied", 
            "D": "Deleted", // ignored
            "M": "Modified", 
            "R": "Renamed", // ignored
            "T": "Type", 
            "U": "Unmerged", 
            "X": "Unknown", 
            "B": "Broken"
        }

        const [status, name] = line.split(/\t/);

        files[name] = types[status];
    });

    proc.on('close', (exitCode) => {
        console.log("changes: " + Object.keys(files).length);

        res.json(files);
    });
});

app.get('/files', (req, res) => {
    const path = req.query.path;
    const hash = req.query.hash;

    const files = [];

    const proc = spawn('git', ['-C', path, 'ls-tree', '-r', '-l', hash]);

    proc.stdout.setEncoding('utf8');

    readline.createInterface({ input: proc.stdout, terminal: false }).on('line', (line) => {
        const [ rest, name ] = line.split(/\t/);

        const [ mode, type, hash, size ] = rest.split(/ +/);

        files.push({ mode: mode, type: type, hash: hash, size: size, name: name });
    });

    proc.on('close', (exitCode) => {
        console.log("files: " + Object.keys(files).length);

        res.json(files);
    });
});

app.get('/content', (req, res) => {
    const path = req.query.path;
    const hash = req.query.hash;

    let stdout = "";

    const proc = spawn('git', ['-C', path, 'show', hash]);

    proc.stdout.setEncoding('utf8');

    proc.stdout.on('data', (chunk) => {
        stdout += chunk;
    });

    proc.on('close', (exitCode) => {
        console.log("content: " + hash);

        res.send(stdout);
    });
});

app.get('/diff', (req, res) => {
    const path = req.query.path;
    const hash = req.query.hash;
    const name = req.query.name;

    let stdout = "";

    const proc = spawn('git', ['-C', path, 'diff', hash + '~1', hash, '--', name]);

    proc.stdout.setEncoding('utf8');

    proc.stdout.on('data', (chunk) => {
        stdout += chunk;
    });

    proc.on('close', (exitCode) => {
        console.log(`diff: '${name}'`);

        res.send(stdout);
    });
});

app.listen(port, () => {
    console.log(`App listening at ${host}`);
});

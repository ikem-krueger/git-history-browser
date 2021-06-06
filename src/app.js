const cors = require('cors');
const express = require('express');
const app = express();
const execFile = require('child_process').execFile;

const port = 3000;
const host = `http://localhost:${port}`;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send(host + '/index.html');
});

app.get('/branch', (req, res) => {
    const path = req.query.path;

    execFile('git', ['-C', path, 'branch'], (error, stdout, stderr) => {
        const lines = stdout.split("\n");

        lines.pop();

        res.json(lines);
    });
});

app.get('/commits', (req, res) => {
    const path = req.query.path;

    execFile('git', ['-C', path, 'log', '--pretty=format:%H|%an <%ae>|%ad|%s'], (error, stdout, stderr) => {
        const lines = stdout.split("\n");

        const length = lines.length;

        const messages = [];

        for(let i = 0; i < length; i++) {
            const line = lines[i];

            const [ hash, author, date, message ] = line.split("|");

            messages.push({ hash: hash, author: author, date: date, message: message });
        }

        res.json(messages);
    });
});

app.get('/files', (req, res) => {
    const path = req.query.path;
    const commit = req.query.commit;

    execFile('git', ['-C', path, 'ls-tree', '-r', '-l', commit], (error, stdout, stderr) => {
        const lines = stdout.split("\n");

        lines.pop(); // last line is empty, so remove last element...

        const length = lines.length;

        const files = [];

        for(let i = 0; i < length; i++) {
            const line = lines[i];

            const [ rest, file ] = line.split("\t");

            const [ mode, type, hash, size ] = rest.split(/ +/);

            files.push({ mode: mode, type: type, hash: hash, size: size, file: file });
        }

        res.json(files);
    });
});

app.get('/content', (req, res) => {
    const path = req.query.path;
    const commit = req.query.commit;

    execFile('git', ['-C', path, 'show', commit], (error, stdout, stderr) => {
        const content = stdout;

        res.send(content);
    });
});

app.listen(port, () => {
    console.log(`App listening at ${host}`);
});

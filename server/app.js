const cors = require('cors');
const express = require('express');
const app = express();
const port = 3000;
const execFile = require('child_process').execFile;

app.use(cors());
app.use(express.json());
app.use(express.static('client'));

app.post('/', (req, res) => {
    res.send(`http://localhost:${port}/index.html`);
});

app.post('/history', (req, res) => {
    let path = req.body.path;
    
    execFile('git', ['-C', path, 'log', '--oneline'], (error, stdout, stderr) => {
        let messages = stdout.replace(/([a-z0-9]{7}) (.*)/g, '{ "hash": "$1", "message": "$2" }, ').replace(/\n/g, ' ').replace(/^/, "[ ").replace(/,  $/, " ]");

        res.type('json');

        res.send(messages);
    });
});

app.post('/tree', (req, res) => {
    let path = req.body.path;
    let commit = req.body.commit;
    
    execFile('git', ['-C', path, 'ls-tree', '-r', commit], (error, stdout, stderr) => {
        let files = stdout.replace(/([0-9]{6}) (blob) ([a-z0-9]{40})\t(.*)/g, '{ "hash": "$3", "file": "$4"}, ').replace(/\n/g, ' ').replace(/^/, "[ ").replace(/,  $/, " ]");

        res.type('json');
        
        res.send(files);
    });
});

app.post('/file', (req, res) => {
    let path = req.body.path;
    let commit = req.body.commit;
    
    execFile('git', ['-C', path, 'show', commit], (error, stdout, stderr) => {
        let content = stdout;

        res.send(content);
    });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

const cors = require('cors');
const express = require('express');
const app = express();
const port = 3000;
const execFile = require('child_process').execFile;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/', (req, res) => {
    res.send(`http://localhost:${port}/index.html`);
});

app.post('/history', (req, res) => {
    let path = req.body.path;
    
    execFile('git', ['-C', path, 'log', '--oneline'], (error, stdout, stderr) => {
        let lines = stdout.split("\n");
    
        lines.pop(); // last line is empty, so remove it...

        let length = lines.length;
    
        let messages = [];
        
        for(let i = 0; i < length; i++) {
            let line = lines[i];

            let json = line.replace(/"/g, '\\"').replace(/\t/g, "    ").replace(/([a-z0-9]{6,}) (.*)/, '{ "hash": "$1", "message": "$2" }');
            
            try {
                messages.push(JSON.parse(json));
            } catch(err) {
                console.error(json);
            }
        }

        res.json(messages);
    });
});

app.post('/tree', (req, res) => {
    let path = req.body.path;
    let commit = req.body.commit;
    
    execFile('git', ['-C', path, 'ls-tree', '-r', commit], (error, stdout, stderr) => {
        let lines = stdout.split("\n");
        
        lines.pop(); // last line is empty, so remove it...
        
        let length = lines.length;

        let files = [];
        
        for(let i = 0; i < length; i++) {
            let line = lines[i];

            let json = line.replace(/([0-9]{6}) (blob) ([a-z0-9]{40})\t(.*)/, '{ "hash": "$3", "file": "$4"}');
            
            try {
                files.push(JSON.parse(json));
            } catch(err) {
                console.error(json);
            }
        }
        
        res.json(files);
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

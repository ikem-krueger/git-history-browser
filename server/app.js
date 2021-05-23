function log(fn, req, res) {
    console.log(`${fn} => request: ${req.method} '${req.url}'\n`);
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
        let messages = stdout.replace(/([a-z0-9]{7}) (.*)/g, '{ "hash": "$1", "message": "$2" }, ').replace(/\n/g, ' ').replace(/^/, "[ ").replace(/},  $/, "} ]");
    
        log("populateCommitHistory()", req, messages);

        res.type('json');

        res.send(messages);
    });
});

app.get('/tree', (req, res) => {
    execFile('git', ['-C', path, 'ls-tree', '-r', '468a330'], (error, stdout, stderr) => {
        let files = stdout.replace(/([0-9]{6}) (blob) ([a-z0-9]{40})\t(.*)/g, '{ "hash": "$3", "file": "$4"}, ').replace(/\n/g, ' ').replace(/^/, "[ ").replace(/},  $/, "} ]");
    
        log("populateFilesystemTree()", req, files);
        
        res.type('json');
        
        res.send(files);
    });
});

app.get('/file', (req, res) => {
    // git -C <path> show <commit>
    let content = ".headerlink {\n    display:none;\n    margin:0 0 0 .2em;\n    text-decoration:none;\n    color:#999;\n}\n\nh1:hover *,\nh2:hover *,\nh3:hover *,\nh4:hover *,\nh5:hover *,\nh6:hover * {\n    display:inline;\n}\n";
    
    log("populateFileContent()", req, content);

    res.send(content);
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

var path = "C:\\Users\\Marco\\Documents\\Projekte\\git-log-tree-viewer";

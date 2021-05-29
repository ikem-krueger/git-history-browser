String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

const httpRequest = async (url, data, type) => {
    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

        if(type == "json") {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch(e) {
        console.error(e);
    }
}

function dropOptions(selector) {
    let options = document.querySelectorAll(selector);

    let length = options.length;

    for(let i = 0; i < length; i++) {
        let option = options[i];

        option.remove();
    }
}

function dropCommitHistory() {
    dropOptions("#history option");
}

async function populateCommitHistory() {
    dropCommitHistory();

    let history = document.querySelector("#history");

    let path = document.querySelector("#path").value;

    let messages = await httpRequest(host + '/history', { path: path }, type="json");

    let length = messages.length;

    for(let i = 0; i < length; i++) {
        let item = messages[i];

        let option = document.createElement("option");

        option.value = item.hash;
        option.dataset.hash = item.hash;
        option.dataset.author = item.author;
        option.dataset.date = item.date;
        option.innerText = item.message;

        orderByLastCommit ? history.append(option) : history.prepend(option);
    }

    history.selectedIndex = 0;

    let slider = document.querySelector("#slider");

    slider.min = 1;
    slider.value = history.selectedIndex + 1;
    slider.max = history.length; // FIXME

    populateFilesystemTree();
}

function dropFilesystemTree() {
    dropOptions("#tree option");
}

async function populateFilesystemTree() {
    dropFilesystemTree();

    let history = document.querySelector("#history");
    let tree = document.querySelector("#tree");

    let path = document.querySelector("#path").value;
    let commit = history.value;

    let files = await httpRequest(host + '/tree', { path: path, commit: commit }, type="json");

    let length = files.length;

    for(let i = 0; i < length; i++) {
        let item = files[i];

        let option = document.createElement("option");

        option.value = item.hash;
        option.dataset.mode = item.mode;
        option.dataset.type = item.type;
        option.dataset.size = item.size;
        option.innerText = item.file;

        tree.append(option);
    }

    tree.selectedIndex = 0; // FIXME: hardcoded value

    populateFileContent();
}

async function populateFileContent() {
    let tree = document.querySelector("#tree");
    let file = document.querySelector("#file");
    let contentType = document.querySelector("#content-type");

    let path = document.querySelector("#path").value;
    let commit = tree.value;

    let content = await httpRequest(host + '/file', { path: path, commit: commit }, type="text");

    file.innerText = content;

    if(syntaxHighlighting) {
        file.classList = [ "hljs" ];

        hljs.highlightElement(file); // then highlight each

        contentType.innerText = "Type: " + file.classList[file.classList.length - 1].capitalize();
    }
}

function main() {
    let form = document.querySelector("form");

    form.addEventListener("submit", (event) => { event.preventDefault(); });

    let path = document.querySelector("#path");

    path.value = repo;

    path.addEventListener("keydown", (event) => { if(event.key == "Enter") { populateCommitHistory(); }});

    let history = document.querySelector("#history");

    history.addEventListener("change", (event) => { slider.value = (history.selectedIndex + 1); });
    history.addEventListener("change", (event) => { populateFilesystemTree(); });

    history.addEventListener("change", (event) => { 
        let selectedItem = history[history.selectedIndex];

        let commitHash = document.querySelector("#commit-hash");
        let commitAuthor = document.querySelector("#commit-author");
        let commitDate = document.querySelector("#commit-date");

        commitHash.innerText = "Hash: " + selectedItem.dataset.hash;
        commitAuthor.innerText = "Author: " + selectedItem.dataset.author;
        commitDate.innerText = "Date: " + selectedItem.dataset.date;
    });

    populateCommitHistory();

    let filterCommits = document.querySelector("#filter-commits");

    filterCommits.addEventListener("keyup", (event) => {
        let search = event.target.value.toLowerCase();

        let all = document.querySelectorAll("#history option")

        for(let i of all) {
            let item = i.innerHTML.toLowerCase();

            item.indexOf(search) == -1 ? i.classList.add("hide") : i.classList.remove("hide");
        }
    });

    let slider = document.querySelector("#slider");

    slider.min = 1;
    slider.value = history.selectedIndex + 1;
    slider.max = history.length; // FIXME

    slider.addEventListener("change", (event) => { history.selectedIndex = (slider.value - 1); });
    slider.addEventListener("change", (event) => { populateFilesystemTree(); });

    let tree = document.querySelector("#tree");

    tree.addEventListener("change", (event) => { populateFileContent(); });

    tree.addEventListener("change", (event) => { 
        let selectedItem = tree[tree.selectedIndex];

        let fileHash = document.querySelector("#file-hash");
        let fileMode = document.querySelector("#file-mode");
        let fileSize = document.querySelector("#file-size");

        fileHash.innerText = "Hash: " + tree[tree.selectedIndex].value;
        fileMode.innerText = "Mode: " + selectedItem.dataset.mode;
        fileSize.innerText = "Size: " + selectedItem.dataset.size + " Byte";
   });

    // TODO: remove redundant code...
    let filterFiles = document.querySelector("#filter-files");

    filterFiles.addEventListener("keyup", (event) => {
        let search = event.target.value.toLowerCase();

        let all = document.querySelectorAll("#tree option")

        for(let i of all) {
            let item = i.innerHTML.toLowerCase();

            item.indexOf(search) == -1 ? i.classList.add("hide") : i.classList.remove("hide");
        }
    });
}

const port = "3000";
const host = `http://localhost:${port}`;

var orderByLastCommit = true;
var syntaxHighlighting = false;

var repo = "C:\\Users\\Marco\\Documents\\Projekte\\git-log-tree-viewer";

main();

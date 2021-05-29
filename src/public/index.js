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

function filterOptions(selector, search) {
    let all = document.querySelectorAll(selector);

    let length = all.length;

    for(let i = 0; i < length; i++) {
        let item = all[i];
        
        let text = item.innerHTML.toLowerCase();

        text.indexOf(search) == -1 ? item.classList.add("hide") : item.classList.remove("hide");
    }
}

async function populateCommitHistory() {
    let history = document.querySelector("#history");

    let path = document.querySelector("#path").value;

    let messages = await httpRequest(host + '/history', { path: path }, type="json");

    let length = messages.length;

    history.length = length;

    for(let i = 0; i < length; i++) {
        let item = messages[i];

        let option = history[i];

        option.value = item.hash;
        option.dataset.hash = item.hash;
        option.dataset.author = item.author;
        option.dataset.date = item.date;
        option.innerText = item.message;
    }

    history.selectedIndex = 0;

    let slider = document.querySelector("#slider");

    slider.min = 1;
    slider.value = history.selectedIndex + 1;
    slider.max = history.length; // FIXME

    populateFilesystemTree();
}

async function populateFilesystemTree() {
    let history = document.querySelector("#history");
    let tree = document.querySelector("#tree");

    let path = document.querySelector("#path").value;
    let commit = history.value;

    let files = await httpRequest(host + '/tree', { path: path, commit: commit }, type="json");

    let length = files.length;

    tree.length = length;

    for(let i = 0; i < length; i++) {
        let item = files[i];

        let option = tree[i];

        option.value = item.hash;
        option.dataset.mode = item.mode;
        option.dataset.type = item.type;
        option.dataset.size = item.size;
        option.innerText = item.file;
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
}

function main() {
    let form = document.querySelector("form");

    form.addEventListener("submit", (event) => { event.preventDefault(); });

    let path = document.querySelector("#path");

    path.value = repo;

    path.addEventListener("keydown", (event) => { if(event.key == "Enter") { populateCommitHistory(); }});

    let history = document.querySelector("#history");

    history.addEventListener("change", (event) => {
        slider.value = (history.selectedIndex + 1);

        populateFilesystemTree();

        let selectedItem = history[history.selectedIndex];

        let commitHash = document.querySelector("#commit-hash");
        let commitAuthor = document.querySelector("#commit-author");
        let commitDate = document.querySelector("#commit-date");

        commitHash.innerText = "Hash: " + selectedItem.dataset.hash;
        commitAuthor.innerText = "Author: " + selectedItem.dataset.author;
        commitDate.innerText = "Date: " + selectedItem.dataset.date;
    });

    let filterCommits = document.querySelector("#filter-commits");

    filterCommits.addEventListener("keyup", (event) => {
        let search = event.target.value.toLowerCase();

        filterOptions("#history option", search);
    });

    let slider = document.querySelector("#slider");

    slider.addEventListener("change", (event) => {
        history.selectedIndex = (slider.value - 1);

        populateFilesystemTree();
    });

    let tree = document.querySelector("#tree");

    tree.addEventListener("change", (event) => {
        populateFileContent();

        let selectedItem = tree[tree.selectedIndex];

        let fileHash = document.querySelector("#file-hash");
        let fileMode = document.querySelector("#file-mode");
        let fileSize = document.querySelector("#file-size");

        fileHash.innerText = "Hash: " + tree[tree.selectedIndex].value;
        fileMode.innerText = "Mode: " + selectedItem.dataset.mode;
        fileSize.innerText = "Size: " + selectedItem.dataset.size + " Byte";
    });

    let filterFiles = document.querySelector("#filter-files");

    filterFiles.addEventListener("keyup", (event) => {
        let search = event.target.value.toLowerCase();

        filterOptions("#tree option", search);
    });

    populateCommitHistory();
}

const port = "3000";
const host = `http://localhost:${port}`;

var repo = "C:\\Users\\Marco\\Documents\\Projekte\\git-log-tree-viewer";

main();

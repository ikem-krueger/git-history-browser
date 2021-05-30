const port = "3000";
const host = `http://localhost:${port}`;

let timerId;

let debounce = (func) => {
    return (...args) => {
        clearTimeout(timerId);

        timerId = setTimeout(func, 200, ...args);
    }
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
    let commits = document.querySelector("#commits");

    let path = document.querySelector("#path").value;

    let messages = await httpRequest(host + '/commits', { path: path }, type="json");

    let length = messages.length;

    commits.length = length;

    for(let i = 0; i < length; i++) {
        let option = commits[i];
        let item = messages[i];

        option.innerText = item.message;
        option.value = item.hash;
        option.dataset.hash = item.hash;
        option.dataset.author = item.author;
        option.dataset.date = item.date;
    }

    commits.selectedIndex = 0;

    commits.focus();

    let slider = document.querySelector("#slider");

    slider.min = 1;
    slider.value = commits.selectedIndex + 1;
    slider.max = commits.length;

    populateFilesystemTree();
}

async function populateFilesystemTree() {
    let commits = document.querySelector("#commits");
    let files = document.querySelector("#files");

    let path = document.querySelector("#path").value;
    let commit = commits.value;

    let tree = await httpRequest(host + '/files', { path: path, commit: commit }, type="json");

    let length = tree.length;

    files.length = length;

    for(let i = 0; i < length; i++) {
        let option = files[i];
        let item = tree[i];

        option.innerText = item.file;
        option.value = item.hash;
        option.dataset.mode = item.mode;
        option.dataset.type = item.type;
        option.dataset.size = item.size;
    }

    files.selectedIndex = 0; // FIXME: hardcoded value

    let slider = document.querySelector("#slider");

    slider.value = (commits.selectedIndex + 1);

    let selectedItem = commits[commits.selectedIndex];

    let commitNumber = document.querySelector("#commit-number");
    let commitHash = document.querySelector("#commit-hash");
    let commitAuthor = document.querySelector("#commit-author");
    let commitDate = document.querySelector("#commit-date");

    commitNumber.innerText = `Commit: #${(commits.length - commits.selectedIndex)}/${commits.length}`;
    commitHash.innerText = `Hash: ${selectedItem.dataset.hash}`;
    commitAuthor.innerText = `Author: ${selectedItem.dataset.author}`;
    commitDate.innerText = `Date: ${selectedItem.dataset.date}`;

    populateFileContent();
}

async function populateFileContent() {
    let files = document.querySelector("#files");
    let content = document.querySelector("#content");

    let path = document.querySelector("#path").value;
    let commit = files.value;

    let file = await httpRequest(host + '/content', { path: path, commit: commit }, type="text");

    content.innerText = file;

    let selectedItem = files[files.selectedIndex];

    let fileNumber = document.querySelector("#file-number");
    let fileHash = document.querySelector("#file-hash");
    let fileMode = document.querySelector("#file-mode");
    let fileSize = document.querySelector("#file-size");

    fileNumber.innerText = `File: #${(files.selectedIndex + 1)}/${files.length}`;
    fileHash.innerText = `Hash: ${files[files.selectedIndex].value}`;
    fileMode.innerText = `Mode: ${selectedItem.dataset.mode}`;
    fileSize.innerText = `Size: ${selectedItem.dataset.size} Byte`;
}

function main() {
    populateCommitHistory = debounce(populateCommitHistory);
    populateFilesystemTree = debounce(populateFilesystemTree);
    populateFileContent = debounce(populateFileContent);
    filterOptions = debounce(filterOptions);

    let form = document.querySelector("form");

    form.addEventListener("submit", (event) => { 
        event.preventDefault();
    });

    let path = document.querySelector("#path");

    path.addEventListener("keydown", (event) => {
        if(event.key == "Enter") {
            populateCommitHistory();
        }
    });

    path.focus();

    let commits = document.querySelector("#commits");

    commits.addEventListener("change", (event) => {
        populateFilesystemTree();
    });

    let filterCommits = document.querySelector("#filter-commits");

    filterCommits.addEventListener("keyup", (event) => {
        let search = event.target.value.toLowerCase();

        filterOptions("#commits option", search);
    });

    let slider = document.querySelector("#slider");

    slider.addEventListener("change", (event) => {
        commits.selectedIndex = (slider.value - 1);

        populateFilesystemTree();
    });

    let files = document.querySelector("#files");

    files.addEventListener("change", (event) => {
        populateFileContent();
    });

    let filterFiles = document.querySelector("#filter-files");

    filterFiles.addEventListener("keyup", (event) => {
        let search = event.target.value.toLowerCase();

        filterOptions("#files option", search);
    });

    if(path.value) {
        populateCommitHistory();
    }
}

main();

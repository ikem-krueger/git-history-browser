const port = "3000";
const host = `http://localhost:${port}`;

let timerId;

const ms = 200;

const debounce = (func) => {
    return (...args) => {
        clearTimeout(timerId);

        timerId = setTimeout(func, ms, ...args);
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

function filterOptions(event) {
    const all = event.target.parentElement.querySelectorAll("select option");

    const length = all.length;

    for(let i = 0; i < length; i++) {
        const item = all[i];

        const text = item.innerHTML.toLowerCase();

        const search = event.target.value.toLowerCase();

        text.indexOf(search) == -1 ? item.classList.add("hide") : item.classList.remove("hide");
    }
}

async function populateCommitHistory() {
    const commits = document.querySelector("#commits");

    const path = document.querySelector("#path").value;

    const messages = await httpRequest(host + '/commits', { path: path }, type="json");

    const length = messages.length;

    commits.length = length; // create empty option elements

    for(let i = 0; i < length; i++) { // fill them with data
        const option = commits[i];
        const item = messages[i];

        option.innerText = item.message;
        option.value = item.hash;
        option.dataset.hash = item.hash;
        option.dataset.author = item.author;
        option.dataset.date = item.date;
    }

    commits.selectedIndex = 0;

    commits.focus();

    const slider = document.querySelector("#slider");

    slider.min = 1;
    slider.value = commits.selectedIndex + 1;
    slider.max = commits.length;

    populateFilesystemTree();
}

async function populateFilesystemTree() {
    const commits = document.querySelector("#commits");
    const files = document.querySelector("#files");

    const path = document.querySelector("#path").value;
    const commit = commits.value;

    const tree = await httpRequest(host + '/files', { path: path, commit: commit }, type="json");

    const length = tree.length;

    files.length = length; // create empty option elements

    for(let i = 0; i < length; i++) { // fill them with data
        const option = files[i];
        const item = tree[i];

        option.innerText = item.file;
        option.value = item.hash;
        option.dataset.mode = item.mode;
        option.dataset.type = item.type;
        option.dataset.size = item.size;
    }

    files.selectedIndex = 0; // FIXME: hardcoded value

    const slider = document.querySelector("#slider");

    slider.value = (commits.selectedIndex + 1);

    const selectedItem = commits[commits.selectedIndex];

    const commitNumber = document.querySelector("#commit-number");
    const commitHash = document.querySelector("#commit-hash");
    const commitAuthor = document.querySelector("#commit-author");
    const commitDate = document.querySelector("#commit-date");

    commitNumber.innerText = `Commit: #${(commits.length - commits.selectedIndex)}/${commits.length}`;
    commitHash.innerText = `Hash: ${selectedItem.dataset.hash}`;
    commitAuthor.innerText = `Author: ${selectedItem.dataset.author}`;
    commitDate.innerText = `Date: ${selectedItem.dataset.date}`;

    populateFileContent();
}

async function populateFileContent() {
    const files = document.querySelector("#files");
    const content = document.querySelector("#content");

    const path = document.querySelector("#path").value;
    const commit = files.value;

    const file = await httpRequest(host + '/content', { path: path, commit: commit }, type="text");

    content.innerText = file;

    const selectedItem = files[files.selectedIndex];

    const fileNumber = document.querySelector("#file-number");
    const fileHash = document.querySelector("#file-hash");
    const fileMode = document.querySelector("#file-mode");
    const fileSize = document.querySelector("#file-size");

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

    const form = document.querySelector("form");

    form.addEventListener("submit", (event) => { 
        event.preventDefault();
    });

    const path = document.querySelector("#path");

    path.addEventListener("keydown", (event) => {
        if(event.key == "Enter") {
            populateCommitHistory();
        }
    });

    path.focus();

    const commits = document.querySelector("#commits");

    commits.addEventListener("change", (event) => {
        populateFilesystemTree();
    });

    const filterCommits = document.querySelector("#filter-commits");

    filterCommits.addEventListener("keyup", (event) => {
        filterOptions(event);
    });

    const slider = document.querySelector("#slider");

    slider.addEventListener("change", (event) => {
        commits.selectedIndex = (slider.value - 1);

        populateFilesystemTree();
    });

    const files = document.querySelector("#files");

    files.addEventListener("change", (event) => {
        populateFileContent();
    });

    const filterFiles = document.querySelector("#filter-files");

    filterFiles.addEventListener("keyup", (event) => {
        filterOptions(event);
    });
}

main();

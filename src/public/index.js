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
    const options = event.target.parentElement.querySelector("select").options

    const length = options.length;

    for(let i = 0; i < length; i++) {
        const option = options[i];

        const text = option.innerText.toLowerCase();

        const searchTerm = event.target.value.toLowerCase();

        text.indexOf(searchTerm) == -1 ? option.classList.add("hide") : option.classList.remove("hide");
    }
}

async function populateCommitHistory(path) {
    const selectCommits = document.querySelector("#commits");

    const commits = await httpRequest(host + '/commits', { path: path }, type="json");

    const length = commits.length;

    selectCommits.length = length; // creates empty option elements

    for(let i = 0; i < length; i++) { // fills them with data
        const option = selectCommits[i];
        const commit = commits[i];

        option.innerText = commit.message;
        option.value = commit.hash;
        option.dataset.author = commit.author;
        option.dataset.date = commit.date;
    }

    selectCommits.selectedIndex = 0;

    selectCommits.focus();

    const inputSlider = document.querySelector("#slider");

    inputSlider.min = 1;
    inputSlider.value = selectCommits.selectedIndex + 1;
    inputSlider.max = selectCommits.length;

    const commit = selectCommits[0].value;

    populateFilesystemTree(path, commit);
}

async function populateFilesystemTree(path, commit) {
    const selectFiles = document.querySelector("#files");

    const files = await httpRequest(host + '/files', { path: path, commit: commit }, type="json");

    const length = files.length;

    selectFiles.length = length; // creates empty option elements

    for(let i = 0; i < length; i++) { // fills them with data
        const option = selectFiles[i];
        const file = files[i];

        option.innerText = file.file;
        option.value = file.hash;
        option.dataset.mode = file.mode;
        option.dataset.type = file.type;
        option.dataset.size = file.size;
    }

    selectFiles.selectedIndex = 0; // FIXME: hardcoded value

    commit = selectFiles[0].value;

    populateFileContent(path, commit);

    updateCommitDetails();
}

function updateCommitDetails() {
    const selectCommits = document.querySelector("#commits");
    const inputSlider = document.querySelector("#slider");

    inputSlider.value = (selectCommits.selectedIndex + 1);

    const option = selectCommits[selectCommits.selectedIndex];

    const spanCommitNumber = document.querySelector("#commit-number");
    const spanCommitHash = document.querySelector("#commit-hash");
    const spanCommitAuthor = document.querySelector("#commit-author");
    const spanCommitDate = document.querySelector("#commit-date");

    spanCommitNumber.innerText = `Commit: #${(selectCommits.length - selectCommits.selectedIndex)}/${selectCommits.length}`;
    spanCommitHash.innerText = `Hash: ${option.value}`;
    spanCommitAuthor.innerText = `Author: ${option.dataset.author}`;
    spanCommitDate.innerText = `Date: ${option.dataset.date}`;
}

async function populateFileContent(path, commit) {
    const divContent = document.querySelector("#content");

    const content = await httpRequest(host + '/content', { path: path, commit: commit }, type="text");

    divContent.innerText = content;

    updateFileDetails();
}

function updateFileDetails() {
    const selectFiles = document.querySelector("#files");

    const option = selectFiles[selectFiles.selectedIndex];

    const spanFileNumber = document.querySelector("#file-number");
    const spanFileHash = document.querySelector("#file-hash");
    const spanFileMode = document.querySelector("#file-mode");
    const spanFileSize = document.querySelector("#file-size");

    spanFileNumber.innerText = `File: #${(selectFiles.selectedIndex + 1)}/${selectFiles.length}`;
    spanFileHash.innerText = `Hash: ${option.value}`;
    spanFileMode.innerText = `Mode: ${option.dataset.mode}`;
    spanFileSize.innerText = `Size: ${option.dataset.size} Byte`;
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

    const inputPath = document.querySelector("#path");

    inputPath.addEventListener("keydown", (event) => {
        if(event.key == "Enter") {
            const path = document.querySelector("#path").value;

            populateCommitHistory(path);
        }
    });

    inputPath.focus();

    const selectCommits = document.querySelector("#commits");

    selectCommits.addEventListener("change", (event) => {
        const path = document.querySelector("#path").value;
        const commit = selectCommits.value;

        populateFilesystemTree(path, commit);
    });

    const inputFilterCommits = document.querySelector("#filter-commits");

    inputFilterCommits.addEventListener("keyup", (event) => {
        filterOptions(event);
    });

    const inputSlider = document.querySelector("#slider");

    inputSlider.addEventListener("change", (event) => {
        selectCommits.selectedIndex = (inputSlider.value - 1);

        const path = document.querySelector("#path").value;
        const commit = selectCommits.value;

        populateFilesystemTree(path, commit);
    });

    const selectFiles = document.querySelector("#files");

    selectFiles.addEventListener("change", (event) => {
        const path = document.querySelector("#path").value;
        const commit = selectFiles.value;

        populateFileContent(path, commit);
    });

    const inputFilterFiles = document.querySelector("#filter-files");

    inputFilterFiles.addEventListener("keyup", (event) => {
        filterOptions(event);
    });
}

main();

const port = "3000";
const host = `http://localhost:${port}`;

let timerId;

const ms = 200;

function debounce(func) {
    return (...args) => {
        clearTimeout(timerId);

        timerId = setTimeout(func, ms, ...args);
    }
}

function basename(path) {
    return path.substr(path.lastIndexOf('/') + 1);
}

function saveData(filename, data) {
    // IE11 support
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        const blob = new Blob([data], {type: "octet/stream"});

        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else { // other browsers
        const file = new File([data], filename, {type: "octet/stream"});
        const exportUrl = URL.createObjectURL(file);

        window.location.assign(exportUrl);

        URL.revokeObjectURL(exportUrl);
    }
}

function filterOptions(event) {
    const options = event.target.parentElement.querySelector("select").options

    for(let i = 0; i < options.length; i++) {
        const option = options[i];

        let text = option.textContent.toLowerCase();
        let searchTerm = event.target.value.toLowerCase();

        if(!searchTerm.startsWith("/")){ // if the searchTerm is not a command...
            text.indexOf(searchTerm) == -1 ? option.classList.add("hide") : option.classList.remove("hide");

            continue; // skip the rest of the logic below
        }

        const match = searchTerm.match(/^\/(hash|author|date) (.*)/);

        if(match) {
            const command = match[1];

            switch(command) {
                case "hash":
                    text = option.value;

                    break;
                case "author":
                    text = option.dataset.author.toLowerCase();

                    break;
                case "date":
                    text = option.dataset.date.toLowerCase();

                    break;
            }

            searchTerm = match[2];

            text.indexOf(searchTerm) == -1 ? option.classList.add("hide") : option.classList.remove("hide");
        }
    }
}

async function populateBranches(path) {
    const selectBranch = document.querySelector("#branch");

    const params = new URLSearchParams();

    params.set("path", path);

    const branches = await fetch('/branches?' + params).then(res => res.json());

    selectBranch.length = branches.length;

    for(let i = 0; i < branches.length; i++) {
        const option = selectBranch[i];
        const branch = branches[i].trim();

        const matchAsterisk = branch.match(/^\* (.*)/); // active branch

        if(matchAsterisk) {
            option.textContent = matchAsterisk[1];
            option.value = matchAsterisk[1];

            selectBranch.selectedIndex = i;

            continue;
        }

        const matchHead = branch.match(/^(.*HEAD) -> .*/);

        if(matchHead) {
            option.textContent = branch;
            option.value = matchHead[1];

            continue;
        }

        option.textContent = branch;
        option.value = branch;
    }
}

async function populateCommitHistory(path, branch) {
    const params = new URLSearchParams();

    params.set("path", path);
    params.set("branch", branch);

    const selectCommits = document.querySelector("#commits");

    const commits = await fetch('/commits?' + params).then(res => res.json());

    selectCommits.length = commits.length; // creates empty option elements

    for(let i = 0; i < commits.length; i++) { // fills them with data
        const option = selectCommits[i];
        const commit = commits[i];

        option.textContent = commit.message;
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

    const hash = selectCommits[0].value;

    const infoBox = document.querySelector("#infobox");

    const firstCommit = selectCommits[commits.length -1].dataset.date;
    const lastCommit = selectCommits[0].dataset.date;

    infoBox.textContent = `First commit: ${firstCommit}\n`;
    infoBox.textContent += `Last commit: ${lastCommit}\n`;
    infoBox.textContent += "\n";
    infoBox.textContent += countAuthorCommits(20);

    populateFilesystemTree(path, hash);
}

function countAuthorCommits(max) {
    const commits = document.querySelector("#commits");

    const options = commits.options;

    const authorCommits = {};

    for(let i = 0; i < options.length; i++) {
        const option = options[i];

        const author = option.dataset.author;

        const count = 1;

        authorCommits[author] ? authorCommits[author] += count : authorCommits[author] = count;
    }

    // TODO: refactor the code below
    const v = Object.values(authorCommits).sort((a, b) => b - a).slice(0, max);
    const k = Object.keys(authorCommits);

    const commitsAuthor = {};

    for(let i = 0; i < k.length; i++) {
        const count = authorCommits[k[i]];
        const author = k[i];

        if(v.includes(count)) {

            commitsAuthor[count] = author;
        }
    }

    let output = `Top ${max} contributors:\n\n`;

    for(let i = 0; i < v.length; i++) {
        const nr = i + 1;
        const commits = v[i];
        const author = commitsAuthor[commits];

        output += `#${nr}: ${author} (${commits})\n`;
    }

    return output;
}

async function populateFilesystemTree(path, hash) {
    const selectFiles = document.querySelector("#files");

    const params = new URLSearchParams();
    
    params.set("path", path);
    params.set("hash", hash);

    const files = await fetch('/files?' + params).then(res => res.json());

    selectFiles.length = files.length; // creates empty option elements

    for(let i = 0; i < files.length; i++) { // fills them with data
        const option = selectFiles[i];
        const file = files[i];

        option.textContent = file.file;
        option.value = file.hash;
        option.dataset.mode = file.mode;
        option.dataset.type = file.type;
        option.dataset.size = file.size;
    }

    selectFiles.selectedIndex = 0; // FIXME: hardcoded value

    hash = selectFiles[0].value;

    populateFileContent(path, hash);

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

    spanCommitNumber.textContent = `Commit: #${(selectCommits.length - selectCommits.selectedIndex)}/${selectCommits.length}`;
    spanCommitHash.textContent = `Hash: ${option.value}`;
    spanCommitAuthor.textContent = `Author: ${option.dataset.author}`;
    spanCommitDate.textContent = `Date: ${option.dataset.date}`;
}

async function populateFileContent(path, hash) {
    const divContent = document.querySelector("#content");

    const params = new URLSearchParams();

    params.set("path", path);
    params.set("hash", hash);

    const content = await fetch('/content?' + params).then(res => res.text());

    divContent.textContent = content;

    updateFileDetails();
}

function updateFileDetails() {
    const selectFiles = document.querySelector("#files");

    const option = selectFiles[selectFiles.selectedIndex];

    const spanFileNumber = document.querySelector("#file-number");
    const spanFileHash = document.querySelector("#file-hash");
    const spanFileMode = document.querySelector("#file-mode");
    const spanFileSize = document.querySelector("#file-size");

    spanFileNumber.textContent = `File: #${(selectFiles.selectedIndex + 1)}/${selectFiles.length}`;
    spanFileHash.textContent = `Hash: ${option.value}`;
    spanFileMode.textContent = `Mode: ${option.dataset.mode}`;
    spanFileSize.textContent = `Size: ${option.dataset.size} Bytes`;
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

    const spanInfo = document.querySelector("#info");

    spanInfo.addEventListener("click", (event) => {
        const infoBox = document.querySelector("#infobox");

        if(infoBox.textContent.length > 0) {
            infoBox.classList.toggle("hide");
        }
    });

    const inputPath = document.querySelector("#path");

    inputPath.addEventListener("keydown", async (event) => {
        if(event.key == "Enter") {
            const path = inputPath.value;

            await populateBranches(path);

            const selectBranch = document.querySelector("#branch");

            const branch = selectBranch[selectBranch.selectedIndex].value;

            populateCommitHistory(path, branch);
        }
    });

    const selectBranch = document.querySelector("#branch");

    selectBranch.addEventListener("change", (event) => {
        const path = inputPath.value;

        const branch = selectBranch[selectBranch.selectedIndex].value;

        populateCommitHistory(path, branch);
    });

    inputPath.focus();

    const selectCommits = document.querySelector("#commits");

    selectCommits.addEventListener("change", (event) => {
        const path = inputPath.value;
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

        const path = inputPath.value;
        const commit = selectCommits.value;

        populateFilesystemTree(path, commit);
    });

    const selectFiles = document.querySelector("#files");

    selectFiles.addEventListener("change", (event) => {
        const path = inputPath.value;
        const commit = selectFiles.value;

        populateFileContent(path, commit);
    });

    const inputFilterFiles = document.querySelector("#filter-files");

    inputFilterFiles.addEventListener("keyup", (event) => {
        filterOptions(event);
    });

    const buttonCheckout = document.querySelector("#checkout");

    buttonCheckout.addEventListener("click", (event) => {
        const content = document.querySelector("#content");

        const filename = basename(selectFiles[selectFiles.selectedIndex].textContent);
        const data = content.textContent;

        saveData(filename, data);
    });
}

main();

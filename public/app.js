const port = "3003";
const host = `http://localhost:${port}`;

let timerId;

const timeout = 200;

function debounce(func){
    let timer;

    return (...args) => {
        clearTimeout(timer);

        timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function basename(path) {
    return path.substr(path.lastIndexOf('/') + 1);
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function countAuthorCommits(authorCommits, max) {
    let entries = Object.entries(authorCommits);

    return entries.sort((a, b) => b[1] - a[1]).slice(0, max);
}

async function populateBranches(path) {
    const selectBranch = document.getElementById("branch");

    const params = new URLSearchParams();

    params.set("path", path);

    const branches = await (await fetch('/branches?' + params)).json();

    selectBranch.innerHTML = ""; // remove option elements

    let selectedIndex = 0;

    const fragment = new DocumentFragment();

    branches.map((branch, i) => { // fill them with data
        const option = document.createElement("option");

        branch = branch.trim();

        option.textContent = branch;
        option.value = branch;

        const matchAsterisk = branch.match(/^\* (.*)/);

        if(matchAsterisk) { // active branch
            branch = matchAsterisk[1];

            option.textContent = branch;
            option.value = branch;

            selectedIndex = i;

            populateCommitHistory(path, branch); // --> load commit history
        }

        // HEAD
        const matchHead = branch.match(/^(.*HEAD) -> .*/);

        if(matchHead) {
            option.value = matchHead[1];
        }

        fragment.appendChild(option);
    });

    selectBranch.appendChild(fragment);

    selectBranch.selectedIndex = selectedIndex;
}

async function populateCommitHistory(path, branch) {
    const selectCommits = document.getElementById("commits");

    selectCommits.innerHTML = ""; // remove option elements

    const fragment = new DocumentFragment();

    const authorCommits = {};

    const params = new URLSearchParams();

    params.set("path", path);
    params.set("branch", branch);

    const commits = await (await fetch('/commits?' + params)).json();

    commits.map((commit, i) => {
        const option = document.createElement("option");

        option.textContent = commit.message;
        option.value = commit.hash;
        option.dataset.author = commit.author;
        option.dataset.date = commit.date;
        option.dataset.timestamp = commit.timestamp;
        option.title = commit.message;

        const author = commit.author;

        authorCommits[author] ? authorCommits[author] += 1 : authorCommits[author] = 1;

        if(i == 0) { // first commit
            const hash = commit.hash;

            populateFilesystemTree(path, hash); // --> load filesystem tree
        }

        fragment.appendChild(option);
    })

    selectCommits.appendChild(fragment);

    selectCommits.selectedIndex = 0;

    selectCommits.focus();

    const inputRange = document.getElementById("range");

    inputRange.min = 1;
    inputRange.value = selectCommits.selectedIndex + 1;
    inputRange.max = selectCommits.length;

    updateInfoBox(authorCommits);

    updateCommitDetails();
}

function updateCommitDetails() {
    const selectCommits = document.getElementById("commits");
    const inputRange = document.getElementById("range");

    inputRange.value = (selectCommits.selectedIndex + 1);

    const option = selectCommits[selectCommits.selectedIndex];

    const spanCommitNumber = document.getElementById("commit-number");
    const spanCommitHash = document.getElementById("commit-hash");
    const spanCommitAuthor = document.getElementById("commit-author");
    const spanCommitDate = document.getElementById("commit-date");

    spanCommitNumber.textContent = `${(selectCommits.length - selectCommits.selectedIndex)}/${selectCommits.length}`;
    spanCommitHash.textContent = option.value;
    spanCommitAuthor.textContent = option.dataset.author;
    spanCommitDate.textContent = option.dataset.date;
}

function updateInfoBox(authorCommits) {
    const selectCommits = document.getElementById("commits");
    const firstCommit = document.getElementById("firstCommit");
    const lastCommit = document.getElementById("lastCommit");

    firstCommit.textContent = selectCommits[commits.length -1].dataset.date + ", Author: " + selectCommits[commits.length -1].dataset.author;
    lastCommit.textContent = selectCommits[0].dataset.date + ", Author: " + selectCommits[0].dataset.author;

    const sorted = countAuthorCommits(authorCommits, 10);

    const labels = [];
    const values = [];

    sorted.map((entry, i) => {
        const nr = i + 1;
        const [author, commits] = entry;

        labels.push(author);
        values.push(commits);
    });

    const data = [{
        values: values,
        labels: labels,
        type: 'pie'
    }];

    const layout = {
        width: 500,
        height: 250,
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0
        },
        font: {
            family: "Tahoma",
            size: "13"
        },
        legend: {
            "bgcolor": "ffffffaa",
            "x": 0,
            "xanchor": "left",
            "itemclick": false,
            "itemdoubleclick": false
        }
    };

    Plotly.newPlot("plot", data, layout, { displayModeBar: false });
}

async function populateFilesystemTree(path, hash) {
    const selectCommits = document.getElementById("commits");
    const selectFiles = document.getElementById("files");
    const checkboxShowAllFiles = document.getElementById("show_all_files");

    const params = new URLSearchParams();

    params.set("path", path);
    params.set("hash", hash);

    const changedFiles = await (await fetch('/changes?' + params)).json();
    const files = await (await fetch('/files?' + params)).json();

    selectFiles.innerHTML = ""; // remove option elements

    const fragment = new DocumentFragment();

    files.map((file, i) => {
        const option = document.createElement("option");

        option.textContent = file.name;
        option.value = file.hash;
        option.dataset.mode = file.mode;
        option.dataset.type = capitalize(file.type);
        option.dataset.size = file.size;
        option.dataset.change = changedFiles[file.name] || "None";
        option.title = file.name;

        if(!(checkboxShowAllFiles.checked || changedFiles[file.name])) {
            option.classList.add("hide");
        }

        fragment.appendChild(option);
    });

    selectFiles.appendChild(fragment);

    selectFiles.selectedIndex = selectFiles.querySelector("option:not([data-change='None'])").index;

    toggleFileDiff(path);

    updateFileDetails();
}

function toggleFileDiff(path) {
    const selectFiles = document.getElementById("files");
    const selectCommits = document.getElementById("commits");
    const checkboxShowFullFile = document.getElementById("show_full_file");

    if(checkboxShowFullFile.checked) {
        const hash = selectFiles[selectFiles.selectedIndex].value;

        showFullFile(path, hash);
    } else {
        const hash = selectCommits.value;
        const name = selectFiles[selectFiles.selectedIndex].textContent;

        showDiff(path, hash, name);
    }
}

function showAllFiles() {
    const selectFiles = document.getElementById("files");

    const options = files.querySelectorAll("option");

    Array.prototype.map.call(options, option => {
        option.classList.remove("hide");
    });

    selectFiles.selectedIndex = 0;
}

function showChangedFiles() {
    const selectFiles = document.getElementById("files");

    const options = selectFiles.querySelectorAll("option");

    Array.prototype.map.call(options, option => {
        if(option.dataset.change == "None") {
            option.classList.add("hide");
        }
    });

    selectFiles.selectedIndex = selectFiles.querySelector("option:not([data-change='None'])").index;
}

function checkStatus(response) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
  }
  return response;
}

function loadData(url, name) {
  fetch(url)
    .then(response => checkStatus(response) && response.arrayBuffer())
    .then(buffer => {
       saveData(name, buffer);
    })
    .catch(err => console.error(err)); // Never forget the final catch!
}

function saveData(name, data) {
  // IE11 support
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      const blob = new Blob([data], {type: "octet/stream"});

      window.navigator.msSaveOrOpenBlob(blob, name);
  } else { // other browsers
      const file = new File([data], name, {type: "octet/stream"});
      const exportUrl = URL.createObjectURL(file);

      window.location.assign(exportUrl);

      URL.revokeObjectURL(exportUrl);
  }
}

async function showFullFile2(path, name, hash) {
  const params = new URLSearchParams();

  params.set("path", path);
  params.set("hash", hash);

  loadData('/content?' + params, name);
}

async function showFullFile(path, hash) {
  const divContent = document.getElementById("content");
  const checkboxShowFullFile = document.getElementById("show_full_file");

  const params = new URLSearchParams();

  params.set("path", path);
  params.set("hash", hash);

  const myPromise = await fetch('/content?' + params);
  const content = await myPromise.text();

  divContent.textContent = content;

  divContent.scrollTop = 0;

  updateFileDetails();
}

async function showDiff(path, hash, name) {
    const divContent = document.getElementById("content");

    const params = new URLSearchParams();

    params.set("path", path);
    params.set("hash", hash);
    params.set("name", name);

    const diff = await (await fetch('/diff?' + params)).text();

    divContent.textContent = diff;
}

function updateFileDetails() {
    const selectFiles = document.getElementById("files");

    const option = selectFiles[selectFiles.selectedIndex];

    const spanFileNumber = document.getElementById("file-number");
    const spanFileHash = document.getElementById("file-hash");
    const spanFileMode = document.getElementById("file-mode");
    const spanFileType = document.getElementById("file-type");
    const spanFileSize = document.getElementById("file-size");
    const spanFileChange = document.getElementById("file-change");

    spanFileNumber.textContent = `${(selectFiles.selectedIndex + 1)}/${selectFiles.length}`;
    spanFileHash.textContent = option.value;
    spanFileMode.textContent = option.dataset.mode;
    spanFileType.textContent = option.dataset.type;
    spanFileSize.textContent = option.dataset.size;
    spanFileChange.textContent = option.dataset.change;
}

function filterOptions(event) {
    const options = event.target.parentElement.parentElement.querySelector("select").options;

    Array.prototype.map.call(options, option => {
        let textContent = option.textContent.toLowerCase();
        let searchTerm = event.target.value.toLowerCase();

        if(!searchTerm.startsWith("/")){ // if the searchTerm is not a command...
            textContent.indexOf(searchTerm) == -1 ? option.classList.add("hide") : option.classList.remove("hide");

            return; // skip the rest of the logic below
        }

        const match = searchTerm.match(/^\/(hash|author|date|change) (.*)/);

        if(!match) {
            return;
        }

        const command = match[1];

        switch(command) {
            case "hash":
                textContent = option.value;

                break;
            case "author":
                textContent = option.dataset.author.toLowerCase();

                break;
            case "date":
                textContent = option.dataset.date.toLowerCase();

                break;
            case "change":
                textContent = option.dataset.change.toLowerCase();

                break;
        }

        searchTerm = match[2];

        textContent.indexOf(searchTerm) == -1 ? option.classList.add("hide") : option.classList.remove("hide");
    });
}

function main() {
    populateCommitHistory = debounce(populateCommitHistory);
    populateFilesystemTree = debounce(populateFilesystemTree);
    showFullFile = debounce(showFullFile);
    showDiff = debounce(showDiff);
    filterOptions = debounce(filterOptions);

    const spanInfo = document.getElementById("info");

    spanInfo.addEventListener("click", (event) => {
        const infoBox = document.getElementById("infobox");

        if(infoBox.textContent.length > 0) {
            infoBox.classList.toggle("hide");
        }
    });

    const inputPath = document.getElementById("path");

    inputPath.addEventListener("keydown", async (event) => {
        if(event.key == "Enter") {
            const path = inputPath.value;

            populateBranches(path);
        }
    });

    const selectBranch = document.getElementById("branch");

    selectBranch.addEventListener("change", (event) => {
        const path = inputPath.value;

        const branch = selectBranch[selectBranch.selectedIndex].value;

        populateCommitHistory(path, branch);
    });

    inputPath.focus();

    const selectCommits = document.getElementById("commits");

    selectCommits.addEventListener("change", (event) => {
        const path = inputPath.value;
        const hash = selectCommits.value;

        populateFilesystemTree(path, hash);

        updateCommitDetails();
    });

    const inputFilterCommits = document.getElementById("filter-commits");

    inputFilterCommits.addEventListener("keyup", event => filterOptions(event));

    const inputRange = document.getElementById("range");

    inputRange.addEventListener("change", (event) => {
        selectCommits.selectedIndex = (inputRange.value - 1);

        const path = inputPath.value;
        const hash = selectCommits.value;

        populateFilesystemTree(path, hash);
    });

    const selectFiles = document.getElementById("files");

    selectFiles.addEventListener("change", (event) => {
        const path = inputPath.value;

        toggleFileDiff(path);

        updateFileDetails();
    });

    const inputFilterFiles = document.getElementById("filter-files");

    inputFilterFiles.addEventListener("keyup", event => filterOptions(event));

    const checkboxShowAllFiles = document.getElementById("show_all_files");

    checkboxShowAllFiles.addEventListener("change", event => { checkboxShowAllFiles.checked ? showAllFiles() : showChangedFiles() });

    const buttonCheckout = document.getElementById("checkout");

    buttonCheckout.addEventListener("click", async (event) => {
      const option = selectFiles[selectFiles.selectedIndex];

      const path = inputPath.value;
      const name = basename(option.textContent);
      const hash = option.value;

      showFullFile2(path, name, hash);
  });

    const checkboxShowFullFile = document.getElementById("show_full_file");

    checkboxShowFullFile.addEventListener("change", async (event) => {
        const path = inputPath.value;

        toggleFileDiff(path);
    });
}

main();

// git -C <path> log --oneline
function fetchLog(path) {
	return [
		{ "hash": "c5ac52b", "message": "Fix dash on beginning/end of link" }, 
		{ "hash": "7a2b38e", "message": "Add missing newline" }, 
		{ "hash": "8122f3f", "message": "Add comment" }, 
		{ "hash": "201bcde", "message": "Update logic" }, 
		{ "hash": "cef03b3", "message": "Refactor" }, 
		{ "hash": "8b3edf0", "message": "Add css style for the header links" }, 
		{ "hash": "96aa850", "message": "Add logic for adding header links" }, 
		{ "hash": "b51bfa4", "message": "Fix link" }, 
		{ "hash": "9edf43c", "message": "Change substitution symbol to be more in line with most websites" }, 
		{ "hash": "6761e6d", "message": "Initial commit" }
	]
}

// git -C <path> ls-tree -r <commit>
function fetchTree(commit) {
	return [
        { "hash": "8799ad7eade90b481d06fb1703fd6c464210e367", "file": "Links.txt" }, 
        { "hash": "97219aebe1d4be4c7df577b9f15922610468fa92", "file": "header-link-emperor.css" }, 
        { "hash": "76815ee992673236b838629a77acbcdb428562c1", "file": "header-link-emperor.js" }, 
        { "hash": "90687de26d71e91b7c82565772a7df470ae277a6", "file": "icons/header-link-emperor-48.png" }, 
        { "hash": "a1129b78e86930bda45c7ca18806ffd1bca606ca", "file": "manifest.json" }
	]
}

// git -C <path> show <commit>
function fetchFile(commit) {
	return ".headerlink {\n    display:none;\n    margin:0 0 0 .2em;\n    text-decoration:none;\n    color:#999;\n}\n\nh1:hover *,\nh2:hover *,\nh3:hover *,\nh4:hover *,\nh5:hover *,\nh6:hover * {\n    display:inline;\n}\n";
}

function populateCommitHistory() {
	let path = document.querySelector("#path").value;
	let history = document.querySelector("#history");

	let log = fetchLog(path);

	let orderByLastCommit = false;

	log.forEach(item => {
		let option = document.createElement("option");
		
		option.value = item.hash;
		option.innerText = item.message;
		
		orderByLastCommit ? history.append(option) : history.prepend(option);
	});
	
	history.querySelectorAll("option")[5].selected = true; // FIXME: hardcoded value

	populateFilesystemTree();
}

function populateFilesystemTree() {
	let tree = document.querySelector("#tree");

	let files = fetchTree("cef03b3");

	files.forEach(item => {
		let option = document.createElement("option");
		
		option.value = item.hash;
		option.innerText = item.file;
		
		tree.append(option);
	});
	
	tree.querySelectorAll("option")[1].selected = true; // FIXME: hardcoded value

	populateFileContent();
}

function populateFileContent() {
	let file = document.querySelector("#file");

	let content = fetchFile("97219aebe1d4be4c7df577b9f15922610468fa92");
	
	file.value = content;
}

populateCommitHistory();

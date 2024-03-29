
# Git History Browser

Helps developers to get an overview of the changes in a git repository.

## Features

- See the last made changes at first glance
- Find the 20 most active contributers of your project
- Inspect branches without checking them out
- Filter commits by message/hash/author/date
- Filter files by name/hash/change
- Inspect the filesystem tree for a certain commit
- Checkout a file from the filesystem tree

## Screenshots

![App Screenshot](https://github.com/ikem-krueger/git-history-browser/raw/master/Screenshot.png)

## Dependencies

[Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/en/download/) need to be installed.

## Run Locally

Clone the project

```bash
  git clone https://github.com/ikem-krueger/git-history-browser
```

Go to the project directory

```bash
  cd git-history-browser
```

Install dependencies

```bash
  npm install
```

Start the app

```bash
  npm start
```

## FAQ

#### How do I filter commits by message?

To filter commits by message, just type the search term, and it is filtered instantly.

#### How do I filter commits by hash/author/date?

To filter commits by hash/author/date, type "/" followed by the filter type, followed by a single space and the search term.

Examples:

    /hash 38443cf7a54141fd2892911834269cdf35a883d7
    /author Ikem Krueger <ikem.krueger@gmail.com>
    /date Tue Jun 15 00:52:15 2021 +0200

#### How do I filter files by name?

To filter files by name, just type the search term, and it is filtered instantly.

#### How do I filter files by hash?

To filter files by hash, type "/hash" followed by a single space and the search term.

Example:

    /hash 3689171dccf959b271f0ced48a56fec0ea065182

#### How do I filter files by change?

To filter files by change, type "/change" followed by a single space and one of:

* Added
* Copied
* Modified
* Type
* Unmerged
* Unknown
* Broken

Examples:

    /change Added
    /change Modified

## Known Issues and Limitations

* git repositories with 20000+ commits/files take up to 5 seconds to load
* Firefox loads significant faster then Google Chrome
* checking out binary files produces corrupt files

## Tech Stack

**Client:** VanillaJS

**Server:** Node.js, Express

## Acknowledgements

This README.md is created with [readme.so](https://readme.so/).

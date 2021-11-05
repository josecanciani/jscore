#!/usr/bin/node

/**
 * This script takes a normal CSS file, and outputs a javascript version using document.createElement("style").
 * This is useful to use with shadow elements when browser does not support Constructable Stylesheets
 * Firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=1520690
 */

const fs = require('fs');
const args = process.argv.slice(2);
if (args.length !== 1 || !fs.existsSync(args[0])) {
    console.log('Usage: cssToJs.js path/to/file.css');
    process.exit(1);
}

fs.readFile(args[0], 'utf8' , (err, data) => {
    if (err) {
        console.error(err);
        process.exit(2);
    }
    console.log('export let sheet = document.createElement(\'style\');');
    console.log('sheet.textContent = String.raw\`');
    console.log(data);
    console.log('`;');
});

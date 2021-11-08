#!/bin/bash -e

## This script takes a normal CSS file, and outputs a javascript version using document.createElement("style").
## This is useful to use with shadow elements when browser does not support Constructable Stylesheets
## Firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=1520690

if [ ! -f $1 ]
then
    echo "ERROR: file not found $1"
fi

echo "export let sheet = document.createElement('style');"
echo "sheet.textContent = String.raw\`"
cat $1
echo "\`;"

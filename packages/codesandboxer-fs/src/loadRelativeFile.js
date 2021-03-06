// @flow
const csb = require('codesandboxer');
const fs = require('fs');
const path = require('path');
const resolve = require('resolve');

const relToRelPkgRoot = (resolvedPath, rootDir) =>
  path.relative(rootDir, resolvedPath);

async function loadJS(resolvedPath, pkgJSON, rootDir) {
  let content = fs.readFileSync(resolvedPath, 'utf-8');
  let file = await csb.parseFile(content, pkgJSON);

  return Object.assign({}, file, {
    filePath: relToRelPkgRoot(resolvedPath, rootDir),
  });
}

async function loadRaw(resolvedPath, rootDir) {
  let file = fs.readFileSync(resolvedPath, 'utf-8');
  return {
    file,
    deps: {},
    internalImports: [],
    filePath: relToRelPkgRoot(resolvedPath, rootDir),
  };
}
/* Remove the disable once image loading has been built */
/* eslint-disable-next-line no-unused-vars */
async function loadImages(resolvedPath, rootDir) {
  let file = fs.readFileSync(resolvedPath);
  return {
    file: new Buffer(file).toString('base64'),
    deps: {},
    internalImports: [],
    filePath: relToRelPkgRoot(resolvedPath, rootDir),
  };
}

/*::
import type { Package } from 'codesandboxer'

type LoadRelativeObj = {
filePath: string,
pkgJSON: Package,
rootDir: string,
extensions: Array<string>,
}
*/

async function loadRelativeFile(
  { filePath, pkgJSON, rootDir, extensions } /*: LoadRelativeObj */,
) {
  let absPath = path.resolve(rootDir, filePath);
  let resolvedPath = resolve.sync(absPath, { extensions });
  let extension = path.extname(resolvedPath);
  if (!extension) {
    throw { key: 'fileNoExtension', path: resolvedPath };
  }
  if (extensions.includes(extension)) {
    return loadJS(resolvedPath, pkgJSON, rootDir);
  }

  switch (extension) {
    case '.png':
    case '.jpeg':
    case '.jpg':
    case '.gif':
    case '.bmp':
    case '.tiff':
      return loadImages(resolvedPath, rootDir);
    case '.json':
    case '.css':
      return loadRaw(resolvedPath, rootDir);
    case '.js':
      return loadJS(resolvedPath, pkgJSON, rootDir);
    default:
      throw new Error(
        `unparseable filetype: ${extension} for file ${resolvedPath}`,
      );
  }
}

module.exports = loadRelativeFile;

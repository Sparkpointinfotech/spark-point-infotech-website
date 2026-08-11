// vite-plugin-html-includes.js
import fs from 'node:fs';
import path from 'node:path';

const INCLUDE_RE = /<!--\s*@include\s+([^\s]+?)\s*-->/g;

/**
 * Resolves <!--@include some/file.html--> markers by inlining the referenced
 * file's contents, relative to `partialsRoot`. Runs recursively, so an
 * included partial may itself contain further @include markers.
 */
export default function htmlIncludes(partialsRoot = 'src/partials') {
  const root = path.resolve(process.cwd(), partialsRoot);

  function resolve(html) {
    return html.replace(INCLUDE_RE, (_match, includePath) => {
      const filePath = path.join(root, includePath);
      const partial = fs.readFileSync(filePath, 'utf-8');
      return resolve(partial);
    });
  }

  return {
    name: 'html-includes',
    transformIndexHtml(html) {
      return resolve(html);
    }
  };
}

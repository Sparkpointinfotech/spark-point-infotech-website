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

  function resolveIncludes(html, chain) {
    return html.replace(INCLUDE_RE, (_match, includePath) => {
      const filePath = path.join(root, includePath);

      if (filePath !== root && !filePath.startsWith(root + path.sep)) {
        throw new Error(`@include path escapes partials root: ${includePath}`);
      }

      if (chain.includes(filePath)) {
        const cycle = [...chain, filePath].map((p) => path.relative(root, p)).join(' -> ');
        throw new Error(`Circular @include detected: ${cycle}`);
      }

      const partial = fs.readFileSync(filePath, 'utf-8');
      return resolveIncludes(partial, [...chain, filePath]);
    });
  }

  return {
    name: 'html-includes',
    transformIndexHtml(html) {
      return resolveIncludes(html, []);
    },
    configureServer(server) {
      server.watcher.add(root);
      server.watcher.on('change', (file) => reloadOnPartialChange(file));
      server.watcher.on('add', (file) => reloadOnPartialChange(file));
      server.watcher.on('unlink', (file) => reloadOnPartialChange(file));

      function reloadOnPartialChange(file) {
        if (file === root || file.startsWith(root + path.sep)) {
          server.ws.send({ type: 'full-reload' });
        }
      }
    }
  };
}

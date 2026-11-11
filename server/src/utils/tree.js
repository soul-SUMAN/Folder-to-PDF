const insertPath = (node, segments) => {
  const [head, ...rest] = segments;
  if (!node[head]) node[head] = {};
  if (rest.length) insertPath(node[head], rest);
};

const isDir = (child) => Object.keys(child).length > 0;

const sortEntries = (node) =>
  Object.entries(node).sort(([aName, aChild], [bName, bChild]) => {
    if (isDir(aChild) !== isDir(bChild)) return isDir(aChild) ? -1 : 1;
    return aName.localeCompare(bName);
  });

const collect = (node, prefix = '', lines = []) => {
  const entries = sortEntries(node);

  entries.forEach(([name, child], index) => {
    const isLast = index === entries.length - 1;
    const dir = isDir(child);

    lines.push({
      prefix: prefix + (isLast ? '└── ' : '├── '),
      name: dir ? `${name}/` : name,
      isDir: dir,
    });

    if (dir) collect(child, prefix + (isLast ? '    ' : '│   '), lines);
  });

  return lines;
};

export const buildTreeLines = (paths) => {
  const root = {};
  paths.forEach((p) => insertPath(root, p.split('/')));

  const roots = Object.entries(root);
  if (roots.length === 1) {
    const [name, node] = roots[0];
    return [{ prefix: '', name: `${name}/`, isDir: true }, ...collect(node)];
  }
  return collect(root);
};
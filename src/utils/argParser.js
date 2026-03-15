export function parseArgs(tokens) {
  const args = { _: [] };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.startsWith('--')) {
      const key = t.slice(2);
      const value =
        tokens[i + 1] && !tokens[i + 1].startsWith('--')
          ? tokens[++i]
          : true;
      args[key] = value;
    } else {
      args._.push(t);
    }
  }

  return args;
}
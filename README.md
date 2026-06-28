# gcyphrq-ext-graphml

GraphML graph format extension for [gcyphrq](https://github.com/plelevier/gcyphrq).

Converts [GraphML](https://graphml.graphdrawing.org/) files into gcyphrq's in-memory graph format.

## Install

### Global CLI install

Install `gcyphrq` and this extension globally so the `gcyphrq` command is available everywhere:

```bash
npm install -g gcyphrq gcyphrq-ext-graphml
```

### Project dependency install

Install both as project dependencies:

```bash
npm install gcyphrq gcyphrq-ext-graphml
```

## Usage

### CLI

```bash
gcyphrq -g my-graph.graphml --ext graphml -e 'MATCH (n) RETURN n'
```

### Library

```ts
import { convertWithExtension, executeQuery } from 'gcyphrq';
import { readFileSync } from 'fs';

const content = readFileSync('my-graph.graphml', 'utf-8');
const graphData = await convertWithExtension('graphml', {
  content,
  filePath: 'my-graph.graphml',
});

const results = await executeQuery(graphData, 'MATCH (n) RETURN n');
```

## Supported formats

- `.graphml` files (GraphML 1.0)
- `.xml` files with GraphML content

Parses directed and undirected graphs. Supports node/edge attributes, typed key definitions, and edge identifiers.

## Examples

See the `examples/` directory for sample GraphML files:

### Simple directed graph

```bash
# List all persons
gcyphrq -g examples/simple-directed.graphml --ext graphml -e 'MATCH (n:Person) RETURN n.name'

# Find who Alice knows
gcyphrq -g examples/simple-directed.graphml --ext graphml -e 'MATCH (a:Person {name: "Alice"})-[r]->(b:Person) RETURN b.name, type(r)'

# Find all relationships
gcyphrq -g examples/simple-directed.graphml --ext graphml -e 'MATCH (a:Person)-[r]->(b:Person) RETURN a.name, type(r), b.name'
```

### Graph with typed attributes

```bash
# Find all engineers
gcyphrq -g examples/with-attributes.graphml --ext graphml -e 'MATCH (n:Employee) WHERE n.role = "engineer" RETURN n.name, n.age'

# Find edges with weight > 0.8
gcyphrq -g examples/with-attributes.graphml --ext graphml -e 'MATCH (a:Employee)-[r]->(b:Employee) WHERE r.weight > 0.8 RETURN a.name, type(r), b.name'

# Find who manages whom
gcyphrq -g examples/with-attributes.graphml --ext graphml -e 'MATCH (a:Employee)-[r:MANAGES]->(b:Employee) RETURN a.name, b.name'
```

### Undirected graph

```bash
# List all city connections
gcyphrq -g examples/undirected.graphml --ext graphml -e 'MATCH (a:City)--(b:City) RETURN a.name, b.name'

# Find cities connected to Paris
gcyphrq -g examples/undirected.graphml --ext graphml -e 'MATCH (c:City {name: "Paris"})--(neighbor:City) RETURN neighbor.name'
```

## License

MIT

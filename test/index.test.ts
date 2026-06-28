import { describe, it, expect } from 'vitest';
import graphmlExtension from '../src/index.js';

const simpleGraphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <graph edgedefault="directed">
    <node id="0">
      <data key="label">Person</data>
      <data key="name">Alice</data>
    </node>
    <node id="1">
      <data key="label">Person</data>
      <data key="name">Bob</data>
    </node>
    <edge id="e0" source="0" target="1">
      <data key="type">KNOWS</data>
    </edge>
  </graph>
</graphml>`;

const undirectedGraphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <graph edgedefault="undirected">
    <node id="a">
      <data key="label">City</data>
      <data key="name">Paris</data>
    </node>
    <node id="b">
      <data key="label">City</data>
      <data key="name">Lyon</data>
    </node>
    <edge id="e1" source="a" target="b"/>
  </graph>
</graphml>`;

const attrGraphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="d0" for="node" attr.name="label" attr.type="string">
    <default>DefaultLabel</default>
  </key>
  <key id="d1" for="node" attr.name="name" attr.type="string"/>
  <key id="d2" for="node" attr.name="age" attr.type="int"/>
  <key id="d3" for="edge" attr.name="weight" attr.type="double"/>
  <key id="d4" for="edge" attr.name="type" attr.type="string"/>
  <graph edgedefault="directed">
    <node id="0">
      <data key="d0">Employee</data>
      <data key="d1">Alice</data>
      <data key="d2">30</data>
    </node>
    <node id="1">
      <data key="d0">Employee</data>
      <data key="d1">Bob</data>
      <data key="d2">25</data>
    </node>
    <edge id="e1" source="0" target="1">
      <data key="d4">WORKS_WITH</data>
      <data key="d3">0.8</data>
    </edge>
  </graph>
</graphml>`;

// yWorks-style GraphML: <key> elements lack attr.name, so graphology-graphml
// stores data under "" (empty string) instead of a meaningful attribute name.
const yworksGraphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:y="http://www.yworks.com/xml/graphml">
  <key for="node" id="d0" yfiles.type="nodegraphics"/>
  <key for="edge" id="d1" yfiles.type="edgegraphics"/>
  <graph edgedefault="directed">
    <node id="n1">
      <data key="d0"><y:ShapeNode><y:NodeLabel>ServiceA</y:NodeLabel></y:ShapeNode></data>
    </node>
    <node id="n2">
      <data key="d0"><y:ShapeNode><y:NodeLabel>ServiceB</y:NodeLabel></y:ShapeNode></data>
    </node>
    <node id="n3">
      <data key="d0"><y:ShapeNode><y:NodeLabel>ServiceC</y:NodeLabel></y:ShapeNode></data>
    </node>
    <edge source="n1" target="n2">
      <data key="d1"><y:PolyLineEdge><y:EdgeLabel>calls</y:EdgeLabel></y:PolyLineEdge></data>
    </edge>
    <edge source="n2" target="n3">
      <data key="d1"><y:PolyLineEdge><y:EdgeLabel>depends</y:EdgeLabel></y:PolyLineEdge></data>
    </edge>
  </graph>
</graphml>`;

// GraphML with mixed key styles: some keys have attr.name, some don't.
// The node "n1" has both a "" key (from unnamed key) and a "label" key (from inline).
const mixedKeyGraphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key for="node" id="d0"/>
  <graph edgedefault="directed">
    <node id="n1">
      <data key="d0">extra-data</data>
      <data key="label">NamedNode</data>
    </node>
    <node id="n2">
      <data key="d0">only-unnamed</data>
    </node>
    <edge source="n1" target="n2">
      <data key="type">CONNECTS</data>
    </edge>
  </graph>
</graphml>`;

// GraphML with only unnamed keys, no inline keys at all.
const unnamedOnlyGraphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key for="node" id="k0"/>
  <key for="node" id="k1"/>
  <key for="edge" id="k2"/>
  <graph edgedefault="directed">
    <node id="a">
      <data key="k0">NodeA</data>
      <data key="k1">metadata-a</data>
    </node>
    <node id="b">
      <data key="k0">NodeB</data>
      <data key="k1">metadata-b</data>
    </node>
    <edge source="a" target="b">
      <data key="k2">rel-type</data>
    </edge>
  </graph>
</graphml>`;

describe('graphml extension', () => {
  it('converts a simple GraphML file', async () => {
    const result = await graphmlExtension.convert({
      content: simpleGraphml,
      filePath: 'test.graphml',
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0]?.key).toBe('0');
    expect(result.nodes[1]?.key).toBe('1');
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.source).toBe('0');
    expect(result.edges[0]?.target).toBe('1');
  });

  it('converts an undirected GraphML file', async () => {
    const result = await graphmlExtension.convert({
      content: undirectedGraphml,
      filePath: 'test.graphml',
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.source).toBe('a');
    expect(result.edges[0]?.target).toBe('b');
  });

  it('throws on invalid input', async () => {
    await expect(
      graphmlExtension.convert({
        content: 'not xml',
        filePath: 'invalid.graphml',
      })
    ).rejects.toThrow('invalid.graphml');
  });

  it('accepts Buffer content', async () => {
    const result = await graphmlExtension.convert({
      content: Buffer.from(simpleGraphml),
      filePath: 'test.graphml',
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0]?.key).toBe('0');
    expect(result.edges).toHaveLength(1);
  });

  it('respects custom labelProperty', async () => {
    const result = await graphmlExtension.convert({
      content: simpleGraphml,
      filePath: 'test.graphml',
      labelProperty: 'kind',
    });

    expect(result.nodes[0]?.attributes.kind).toBe('Person');
    expect(result.nodes[0]?.attributes.label).toBeUndefined();
  });

  it('keeps label as-is when labelProperty is default', async () => {
    const result = await graphmlExtension.convert({
      content: simpleGraphml,
      filePath: 'test.graphml',
    });

    expect(result.nodes[0]?.attributes.label).toBe('Person');
  });

  it('preserves node label as node kind', async () => {
    const result = await graphmlExtension.convert({
      content: simpleGraphml,
      filePath: 'test.graphml',
    });

    expect(result.nodes[0]?.attributes.label).toBe('Person');
    expect(result.nodes[1]?.attributes.label).toBe('Person');
  });

  it('preserves edge type attribute', async () => {
    const result = await graphmlExtension.convert({
      content: simpleGraphml,
      filePath: 'test.graphml',
    });

    expect(result.edges[0]?.attributes.type).toBe('KNOWS');
  });

  it('respects custom edgeTypeProperty', async () => {
    const result = await graphmlExtension.convert({
      content: simpleGraphml,
      filePath: 'test.graphml',
      edgeTypeProperty: 'relType',
    });

    expect(result.edges[0]?.attributes.relType).toBe('KNOWS');
    expect(result.edges[0]?.attributes.type).toBeUndefined();
  });

  it('sets graph options for undirected graphs', async () => {
    const result = await graphmlExtension.convert({
      content: undirectedGraphml,
      filePath: 'test.graphml',
    });

    expect(result.options?.type).toBe('undirected');
  });

  it('omits options for directed graphs (default)', async () => {
    const result = await graphmlExtension.convert({
      content: simpleGraphml,
      filePath: 'test.graphml',
    });

    expect(result.options).toBeUndefined();
  });

  it('parses GraphML typed key definitions for nodes and edges', async () => {
    const result = await graphmlExtension.convert({
      content: attrGraphml,
      filePath: 'test.graphml',
    });

    // Node attributes from <key> definitions
    expect(result.nodes[0]?.attributes.label).toBe('Employee');
    expect(result.nodes[0]?.attributes.name).toBe('Alice');
    expect(result.nodes[0]?.attributes.age).toBe(30);
    expect(result.nodes[1]?.attributes.name).toBe('Bob');
    expect(result.nodes[1]?.attributes.age).toBe(25);

    // Edge attributes from <key> definitions
    expect(result.edges[0]?.attributes.type).toBe('WORKS_WITH');
    expect(result.edges[0]?.attributes.weight).toBe(0.8);
  });

  it('preserves edge keys', async () => {
    const result = await graphmlExtension.convert({
      content: simpleGraphml,
      filePath: 'test.graphml',
    });

    expect(result.edges[0]?.key).toBe('e0');
  });

  // ── yWorks-style GraphML: <key> elements without attr.name ──

  it('remaps empty-string node attributes from unnamed keys', async () => {
    const result = await graphmlExtension.convert({
      content: yworksGraphml,
      filePath: 'yworks.graphml',
    });

    // Nodes should have "label" (not "") as the attribute key.
    // graphology-graphml uses textContent, so nested XML collapses to text.
    expect(result.nodes[0]?.attributes['']).toBeUndefined();
    expect(result.nodes[0]?.attributes.label).toBe('ServiceA');
    expect(result.nodes[1]?.attributes.label).toBe('ServiceB');
    expect(result.nodes[2]?.attributes.label).toBe('ServiceC');
  });

  it('remaps empty-string edge attributes from unnamed keys', async () => {
    const result = await graphmlExtension.convert({
      content: yworksGraphml,
      filePath: 'yworks.graphml',
    });

    // Edges should have "type" (not "") as the attribute key.
    expect(result.edges[0]?.attributes['']).toBeUndefined();
    expect(result.edges[0]?.attributes.type).toBe('calls');
    expect(result.edges[1]?.attributes.type).toBe('depends');
  });

  it('remaps empty-string key to custom labelProperty', async () => {
    const result = await graphmlExtension.convert({
      content: yworksGraphml,
      filePath: 'yworks.graphml',
      labelProperty: 'kind',
    });

    expect(result.nodes[0]?.attributes['']).toBeUndefined();
    expect(result.nodes[0]?.attributes.kind).toBe('ServiceA');
    expect(result.nodes[0]?.attributes.label).toBeUndefined();
  });

  it('remaps empty-string key to custom edgeTypeProperty', async () => {
    const result = await graphmlExtension.convert({
      content: yworksGraphml,
      filePath: 'yworks.graphml',
      edgeTypeProperty: 'relType',
    });

    expect(result.edges[0]?.attributes['']).toBeUndefined();
    expect(result.edges[0]?.attributes.relType).toBe('calls');
    expect(result.edges[0]?.attributes.type).toBeUndefined();
  });

  it('does not overwrite existing named property when empty-string key also exists', async () => {
    const result = await graphmlExtension.convert({
      content: mixedKeyGraphml,
      filePath: 'mixed.graphml',
    });

    // n1 has both d0 (→"") and inline label="label".
    // The named "label" should win; "" should be discarded.
    expect(result.nodes[0]?.attributes.label).toBe('NamedNode');
    expect(result.nodes[0]?.attributes['']).toBeUndefined();

    // n2 only has the unnamed key → should remap to "label"
    expect(result.nodes[1]?.attributes.label).toBe('only-unnamed');
    expect(result.nodes[1]?.attributes['']).toBeUndefined();
  });

  it('handles multiple unnamed node keys (first goes to label, others stay as "")', async () => {
    const result = await graphmlExtension.convert({
      content: unnamedOnlyGraphml,
      filePath: 'unnamed.graphml',
    });

    // With multiple unnamed keys, graphology-graphml stores all under "".
    // Since object keys are unique, only one value survives.
    // The remap moves it to "label".
    expect(result.nodes[0]?.attributes['']).toBeUndefined();
    // The value will be whichever one graphology-graphml kept (last-write-wins)
    expect(result.nodes[0]?.attributes.label).toBeDefined();
  });

  it('preserves graph structure (directed) for yWorks GraphML', async () => {
    const result = await graphmlExtension.convert({
      content: yworksGraphml,
      filePath: 'yworks.graphml',
    });

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]?.source).toBe('n1');
    expect(result.edges[0]?.target).toBe('n2');
    expect(result.edges[1]?.source).toBe('n2');
    expect(result.edges[1]?.target).toBe('n3');
    expect(result.options).toBeUndefined(); // directed is default
  });
});

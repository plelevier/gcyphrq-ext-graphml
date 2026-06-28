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
    ).rejects.toThrow();
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
});

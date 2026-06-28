import type { GraphInputExtension, GraphInputExtensionContext, GraphInput } from 'gcyphrq';
import { parse } from 'graphology-graphml';
import Graph from 'graphology';

/**
 * Convert a Graphology graph (created by graphology-graphml) into the
 * GraphInput shape that gcyphrq expects.
 *
 * GraphML stores node labels and edge types as `<data>` elements.
 * The `label` attribute on nodes maps to the gcyphrq node label (kind)
 * (configurable via `ctx.labelProperty`).
 * The `type` attribute on edges maps to the gcyphrq relationship type
 * (configurable via `ctx.edgeTypeProperty`).
 *
 * For mixed graphs, `graphology-graphml` can separate directed and
 * undirected edges. We iterate undirected edges first to mark them,
 * then add all edges.
 */
function graphologyToGraphInput(
  graph: InstanceType<typeof Graph>,
  edgeTypeProperty: string,
  labelProperty: string,
): GraphInput {
  const nodes: GraphInput['nodes'] = [];
  const edges: GraphInput['edges'] = [];

  for (const id of graph.nodes()) {
    const attrs = { ...graph.getNodeAttributes(id) } as Record<string, unknown>;
    // GraphML stores the node label in a "label" data element by default.
    // If the user provided a custom labelProperty and the node doesn't
    // already have that property, remap the attribute name.
    if (labelProperty !== 'label' && attrs.label !== undefined && attrs[labelProperty] === undefined) {
      attrs[labelProperty] = attrs.label;
      delete attrs.label;
    }
    nodes.push({ key: id, attributes: attrs });
  }

  const isMixed = graph.type === 'mixed';

  // In mixed graphs, graphology-graphml stores undirected edges separately.
  // We iterate undirected edges first to mark them, then add all edges.
  const undirectedEdgeIds = new Set<string>();
  if (isMixed && typeof graph.forEachUndirectedEdge === 'function') {
    graph.forEachUndirectedEdge((edgeId: string) => {
      undirectedEdgeIds.add(edgeId);
    });
  }

  graph.forEachEdge((edgeId, attrs, source, target) => {
    const edgeAttrs = { ...attrs } as Record<string, unknown>;
    // GraphML stores the relationship type in a "type" data element by default.
    // If the user provided a custom edgeTypeProperty and the edge doesn't
    // already have that property, we don't need to remap — the graphml parser
    // already uses the key name directly.
    if (edgeTypeProperty !== 'type' && edgeAttrs.type !== undefined && edgeAttrs[edgeTypeProperty] === undefined) {
      edgeAttrs[edgeTypeProperty] = edgeAttrs.type;
      delete edgeAttrs.type;
    }
    const isUndirected = undirectedEdgeIds.has(edgeId);
    edges.push({
      key: edgeId,
      source,
      target,
      ...(isUndirected ? { undirected: true } : {}),
      attributes: edgeAttrs,
    });
  });

  return { nodes, edges };
}

const graphmlExtension: GraphInputExtension = {
  async convert(ctx: GraphInputExtensionContext): Promise<GraphInput> {
    const content = typeof ctx.content === 'string' ? ctx.content : ctx.content.toString();
    const edgeTypeProperty = ctx.edgeTypeProperty ?? 'type';
    const labelProperty = ctx.labelProperty ?? 'label';

    // graphology-graphml needs a Graph constructor. We pass the base Graph
    // constructor which the parser uses to instantiate the right graph type
    // based on the edgedefault attribute.
    try {
      const graph = parse(Graph, content);
      const result = graphologyToGraphInput(graph, edgeTypeProperty, labelProperty);

      // Surface the graph type from the GraphML edgedefault attribute
      // so gcyphrq creates the correct Graphology graph.
      const graphType = graph.type;
      if (graphType !== 'directed') {
        result.options = { type: graphType };
      }

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse GraphML file "${ctx.filePath}": ${message}`);
    }
  },
};

export default graphmlExtension;

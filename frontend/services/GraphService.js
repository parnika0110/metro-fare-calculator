class GraphService {
  constructor(graph) {
    this.graph = graph;
  }

  getNeighbors(node) {
    return this.graph[node] || [];
  }
}
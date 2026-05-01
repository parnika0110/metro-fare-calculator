class RouteService {

  constructor(graphService) {
    this.graphService = graphService;
  }

  findAllRoutes(start, end, maxDepth = 40) {
    let results = [];

    const dfs = (node, path, visited) => {
      if (path.length > maxDepth) return;

      if (node === end) {
        results.push([...path]);
        return;
      }

      for (let neighbor of this.graphService.getNeighbors(node)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          path.push(neighbor);

          dfs(neighbor, path, visited);

          path.pop();
          visited.delete(neighbor);
        }
      }
    };

    dfs(start, [start], new Set([start]));
    return results;
  }

  // Detect change points
  getInterchanges(path, lineMap) {
    let changes = [];

    for (let i = 1; i < path.length; i++) {
      let prevLine = lineMap[path[i - 1]] || "purple";
      let currLine = lineMap[path[i]] || "purple";

      if (prevLine !== currLine) {
        changes.push(path[i]);
      }
    }

    return changes;
  }
}
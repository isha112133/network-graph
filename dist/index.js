"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const port = 3000;
// Serve static files from the "public" directory
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
// API endpoint to serve the network graph data
app.get("/api/network-graph", (req, res) => {
  const filePath = path_1.default.join(__dirname, "../jsonfile.json");
  fs_1.default.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    try {
      const graphData = JSON.parse(data);
      // Extract nodes
      const nodes = graphData.graph.elements.nodes.map((node) => ({
        id: node.data.id,
        label: node.data.full_name,
        group: node.data.group_name1,
      }));
      // Extract edges
      const edges = [];
      graphData.graph.elements.nodes.forEach((node) => {
        const nodeId = node.data.id;
        const neighbors = node.data.out_neighbors[nodeId.toString()];
        if (neighbors) {
          Object.keys(neighbors).forEach((targetId) => {
            edges.push({ from: nodeId, to: parseInt(targetId, 10) });
          });
        }
      });
      // Send the graph data as a response
      res.json({ nodes, edges });
    } catch (parseError) {
      console.error("Error parsing JSON data:", parseError);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

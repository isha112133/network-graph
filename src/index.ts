import express, { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";

const app = express();
const port = 3000;

interface Node {
  id: string;
  label: string;
  group: string;
}

interface Edge {
  from: string;
  to: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

app.use(express.static(path.join(__dirname, "../public")));

// Function to calculate k-core values
function calculateKCore(
  nodes: Node[],
  edges: Edge[]
): { nodeKCore: Record<string, number>; minKCore: number; maxKCore: number } {
  const nodeDegrees: Record<string, number> = {};
  const nodeKCore: Record<string, number> = {};

  nodes.forEach((node) => {
    nodeDegrees[node.id] = 0;
    nodeKCore[node.id] = 0;
  });

  edges.forEach((edge) => {
    nodeDegrees[edge.from]++;
    nodeDegrees[edge.to]++;
  });

  let k = 0;
  let changed = true;

  while (changed) {
    changed = false;
    k++;
    nodes.forEach((node) => {
      if (nodeDegrees[node.id] <= k && nodeKCore[node.id] < k) {
        nodeKCore[node.id] = k;
        edges.forEach((edge) => {
          if (edge.from === node.id || edge.to === node.id) {
            nodeDegrees[edge.from]--;
            nodeDegrees[edge.to]--;
          }
        });
        changed = true;
      }
    });
  }

  const kCoreValues = Object.values(nodeKCore);
  // Safeguard to ensure minKCore and maxKCore are defined
  const minKCore = kCoreValues.length > 0 ? Math.min(...kCoreValues) : 0;
  const maxKCore = kCoreValues.length > 0 ? Math.max(...kCoreValues) : 0;
  return { nodeKCore, minKCore, maxKCore };
}

app.get("/api/network-graph", async (req: Request, res: Response) => {
  try {
    const filePath = path.join(__dirname, "jsonfile1.json");
    const data = await fs.readFile(filePath, "utf8");
    const graphData = JSON.parse(data);

    if (
      !graphData.graph ||
      !graphData.graph.elements ||
      !Array.isArray(graphData.graph.elements.nodes) ||
      !Array.isArray(graphData.graph.elements.edges)
    ) {
      return res.status(400).json({ message: "Invalid JSON structure" });
    }

    const nodes: Node[] = graphData.graph.elements.nodes.map((node: any) => ({
      id: node.data.id.toString(), // Ensure ID is a string
      label: node.data.full_name,
      group: node.data.group_name1,
    }));

    const edges: Edge[] = graphData.graph.elements.edges.map((edge: any) => ({
      from: edge.data.source.toString(), // Ensure IDs are strings
      to: edge.data.target.toString(),
    }));

    // Calculate k-core values
    const { nodeKCore, minKCore, maxKCore } = calculateKCore(nodes, edges);
    console.log(minKCore, maxKCore);
    res.json({ nodes, edges, nodeKCore, minKCore, maxKCore });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

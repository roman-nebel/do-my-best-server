import "dotenv/config";
import fetch from "node-fetch";

const { FILE_ID, ACCESS_TOKEN } = process.env;
const SELECTED_NODE_ID = "145:3622";

async function fetchFigmaFile() {
  const response = await fetch(`https://api.figma.com/v1/files/${FILE_ID}`, {
    headers: {
      "X-Figma-Token": ACCESS_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error("Figma API error");
  }

  const data = await response.json();
  return data;
}

function findNodeById(node, id) {
  if (node.id === id) return node;

  if (node.children) {
    for (let child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }

  return null;
}

function calculateDistance(nodeA, nodeB) {
  const x1 = nodeA.absoluteBoundingBox.x + nodeA.absoluteBoundingBox.width / 2;
  const y1 = nodeA.absoluteBoundingBox.y + nodeA.absoluteBoundingBox.height / 2;
  const x2 = nodeB.absoluteBoundingBox.x;
  const y2 = nodeB.absoluteBoundingBox.y;

  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function findNearestNode(
  selectedNode,
  node,
  nearest = { node: null, distance: Infinity }
) {
  for (const child of node.children) {
    if (child.id !== selectedNode.id && child.absoluteBoundingBox) {
      const distance = calculateDistance(selectedNode, child);

      if (distance < nearest.distance) {
        nearest = { node: child, distance };
      }
    }
  }

  //if (node.children) {
  //  for (let child of node.children) {
  //    nearest = findNearestNode(selectedNode, child, nearest);
  //  }
  //}

  return nearest;
}

function findParentNode(node, targetNodeId) {
  if (node.children) {
    for (let child of node.children) {
      if (child.id === targetNodeId) {
        return node;
      }
      const parent = findParentNode(child, targetNodeId);
      if (parent) return parent;
    }
  }
  return null;
}

async function main() {
  try {
    const fileData = await fetchFigmaFile();
    const document = fileData.document;

    const selectedNode = findNodeById(document, SELECTED_NODE_ID);
    if (!selectedNode) {
      throw new Error("Node wasn't found");
    }

    const parentNode = findParentNode(document, SELECTED_NODE_ID);

    const nearestNodeData = findNearestNode(selectedNode, parentNode);

    if (nearestNodeData.node) {
      console.log("The closiest node:", nearestNodeData.node);
      console.log("Distance:", nearestNodeData.distance);
    } else {
      console.log("No closiest node.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

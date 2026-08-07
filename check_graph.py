import json
g = json.load(open('graphify-out/graph.json', encoding='utf-8'))
print(f'Nodes: {len(g.get("nodes", []))}')
print(f'Edges: {len(g.get("edges", []))}')
// den-grid/src/mesh/GridNode.ts
export class GridNode {
  id: string;
  neighbors: GridNode[] = [];

  capacity: number;
  localSupply: number;
  localDemand: number;

  // pheromone per neighbor id
  pheromones: Map<string, number> = new Map();

  constructor(id: string, capacity: number) {
    this.id = id;
    this.capacity = capacity;
  }

  getLoad(): number {
    return (this.localDemand - this.localSupply) / this.capacity;
  }

  advertiseState() {
    return {
      id: this.id,
      load: this.getLoad(),
    };
  }
}

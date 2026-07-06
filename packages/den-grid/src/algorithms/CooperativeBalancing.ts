// den-grid/src/algorithms/CooperativeBalancing.ts
import { GridNode } from "../mesh/GridNode";

const PHEROMONE_DECAY = 0.05;
const PHEROMONE_BOOST = 0.2;
const MIN_PHEROMONE = 0.01;

export function balanceStep(node: GridNode, neighborStates: { id: string; load: number }[]) {
  const myLoad = node.getLoad();

  // 1. Evaporate pheromones (entropy)
  for (const [nid, tau] of node.pheromones.entries()) {
    const decayed = Math.max(MIN_PHEROMONE, tau * (1 - PHEROMONE_DECAY));
    node.pheromones.set(nid, decayed);
  }

  // 2. Compute desirability for each neighbor
  const desirabilities: { id: string; score: number }[] = [];
  for (const ns of neighborStates) {
    const tau = node.pheromones.get(ns.id) ?? MIN_PHEROMONE;
    const loadDiff = myLoad - ns.load; // positive if I’m more loaded

    // prefer neighbors with lower load when I’m overloaded,
    // or higher load when I have surplus
    const direction = myLoad > 0 ? -loadDiff : loadDiff;
    const score = tau * Math.max(0, direction);

    desirabilities.push({ id: ns.id, score });
  }

  const totalScore = desirabilities.reduce((s, d) => s + d.score, 0);
  if (totalScore <= 0) return; // nothing useful to do

  // 3. Decide flow proportions
  const flows: { id: string; fraction: number }[] = desirabilities.map(d => ({
    id: d.id,
    fraction: d.score / totalScore,
  }));

  // 4. Apply energy transfer (delegated to orchestrator / DEN service)
  //    Here we just return the plan.
  return {
    fromNode: node.id,
    load: myLoad,
    flows, // each { id, fraction } meaning “send this fraction of surplus/deficit”
  };
}

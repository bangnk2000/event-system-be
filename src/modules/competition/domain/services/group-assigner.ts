import { Competitor } from '../competitor';

const GROUP_LABELS = 'ABCDEFGHIJKLMNOP'.split('');

export function groupLabelAt(index: number): string {
  return GROUP_LABELS[index] ?? `G${index + 1}`;
}

/**
 * Serpentine (snake) distribution by seed to balance groups: with 4 groups the seed order
 * A B C D · D C B A · A B C D … so each group gets a comparable spread of strong/weak seeds.
 * Returns competitors with `groupLabel` assigned.
 */
export function assignGroups(competitors: Competitor[], numGroups: number): Competitor[] {
  const sorted = [...competitors].sort((a, b) => a.seed - b.seed);
  return sorted.map((c, i) => {
    const cycle = Math.floor(i / numGroups);
    const pos = i % numGroups;
    const groupIndex = cycle % 2 === 0 ? pos : numGroups - 1 - pos;
    return c.withGroup(groupLabelAt(groupIndex));
  });
}

import { getLabelForValue } from './artistCategories';

export const VIDEO_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "singer", label: getLabelForValue('singer') },
  { value: "dancer", label: getLabelForValue('dancer') },
  { value: "musicians", label: getLabelForValue('musicians') },
  { value: "anchor", label: getLabelForValue('anchor') },
  { value: "DJ", label: getLabelForValue('DJ') },
  { value: "band", label: getLabelForValue('band') },
  { value: "comedian", label: getLabelForValue('comedian') },
  { value: "magician", label: getLabelForValue('magician') },
  { value: "actor", label: getLabelForValue('actor') },
  { value: "mimicry", label: getLabelForValue('mimicry') },
  { value: "specialAct", label: getLabelForValue('specialAct') },
  { value: "spiritual", label: getLabelForValue('spiritual') },
  { value: "kidsEntertainer", label: getLabelForValue('kidsEntertainer') },
];

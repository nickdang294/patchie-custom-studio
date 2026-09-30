const asTags = value => Array.isArray(value) ? value.map(String) : [];

function ruleMatches(source, candidate, rule) {
  const sourceTags = asTags(source.tags);
  const candidateTags = asTags(candidate.tags);
  const sourceRequired = asTags(rule.source_tags);
  const candidateRequired = asTags(rule.target_tags);

  if (!sourceRequired.every(tag => sourceTags.includes(tag))) return false;
  if (!candidateRequired.every(tag => candidateTags.includes(tag))) return false;

  const prefix = String(rule.required_shared_prefix || '').trim();
  if (!prefix) return true;
  return sourceTags.some(tag => tag.startsWith(prefix) && candidateTags.includes(tag));
}

export function scorePatchRecommendation(source, candidate, rules = []) {
  if ((source.recommended_patch_ids || []).includes(candidate.id)) return 10000;

  const sourceTags = asTags(source.tags);
  const candidateTags = asTags(candidate.tags);
  const sharedTagScore = candidateTags.filter(tag => sourceTags.includes(tag)).length;
  const ruleScore = rules.reduce((total, rule) => {
    if (rule?.active === false || !ruleMatches(source, candidate, rule)) return total;
    const score = Number(rule.score);
    return total + (Number.isFinite(score) && score > 0 ? score : 0);
  }, 0);

  return sharedTagScore + ruleScore;
}

export function rankPatchRecommendations(source, candidates, rules = [], limit = 4) {
  const maxResults = Math.min(15, Math.max(0, Number.isFinite(Number(limit)) ? Number(limit) : 15));
  const sourceTags = asTags(source?.tags);
  const recommendedIds = Array.isArray(source?.recommended_patch_ids) ? source.recommended_patch_ids : [];

  // When a patch has no recommendation metadata of its own, use its assigned
  // group(s) as a simple fallback instead of returning an empty suggestion row.
  if (sourceTags.length === 0 && recommendedIds.length === 0) {
    const sourceGroups = new Set([
      ...(Array.isArray(source?.patch_groups) ? source.patch_groups : []),
      ...(source?.patch_group ? [source.patch_group] : []),
    ].map(value => String(value).trim()).filter(Boolean));
    if (sourceGroups.size === 0) return [];

    return candidates
      .filter(patch => {
        const candidateGroups = [
          ...(Array.isArray(patch?.patch_groups) ? patch.patch_groups : []),
          ...(patch?.patch_group ? [patch.patch_group] : []),
        ].map(value => String(value).trim()).filter(Boolean);
        return candidateGroups.some(group => sourceGroups.has(group));
      })
      .slice(0, maxResults);
  }

  return candidates
    .map((patch, index) => ({ patch, index, score: scorePatchRecommendation(source, patch, rules) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxResults)
    .map(item => item.patch);
}

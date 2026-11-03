// Deterministic, explainable roommate compatibility scoring (0-100).
// Every point is derived from real profile fields, never random values.
function calculateCompatibility(a, b) {
  if (!a || !b) return { score: 0, breakdown: [] };

  const breakdown = [];
  let score = 0;

  const budgetMin = Math.max(a.budgetMin || 0, b.budgetMin || 0);
  const budgetMax = Math.min(a.budgetMax || Infinity, b.budgetMax || Infinity);
  if (budgetMax >= budgetMin) {
    score += 25;
    breakdown.push({ label: 'Budget ranges overlap', points: 25 });
  } else {
    const gap = budgetMin - budgetMax;
    const points = gap <= 3000 ? 12 : 0;
    score += points;
    breakdown.push({
      label: gap <= 3000 ? 'Budgets are within ₹3,000 of each other' : 'Budget ranges do not overlap',
      points
    });
  }

  if (a.city && b.city && a.city.toLowerCase() === b.city.toLowerCase()) {
    score += 12;
    breakdown.push({ label: 'Same city', points: 12 });
    if (
      a.locality &&
      b.locality &&
      a.locality.toLowerCase().trim() === b.locality.toLowerCase().trim()
    ) {
      score += 8;
      breakdown.push({ label: 'Same preferred locality', points: 8 });
    }
  } else {
    breakdown.push({ label: 'Different cities', points: 0 });
  }

  if (a.accommodationType && a.accommodationType === b.accommodationType) {
    score += 15;
    breakdown.push({ label: 'Same accommodation preference', points: 15 });
  }

  if (a.foodPreference && a.foodPreference === b.foodPreference) {
    score += 10;
    breakdown.push({ label: 'Matching food preference', points: 10 });
  }

  if (a.sleepSchedule && a.sleepSchedule === b.sleepSchedule) {
    score += 10;
    breakdown.push({ label: 'Similar sleep schedule', points: 10 });
  }

  if (a.smoking === b.smoking) {
    score += 5;
    breakdown.push({ label: 'Matching smoking preference', points: 5 });
  }

  if (a.cleanliness && a.cleanliness === b.cleanliness) {
    score += 5;
    breakdown.push({ label: 'Similar cleanliness standards', points: 5 });
  }

  if (Array.isArray(a.lifestyle) && Array.isArray(b.lifestyle)) {
    const shared = a.lifestyle.filter((item) => b.lifestyle.includes(item));
    if (shared.length) {
      const points = Math.min(10, shared.length * 4);
      score += points;
      breakdown.push({ label: `${shared.length} shared lifestyle preference(s)`, points });
    }
  }

  return { score: Math.min(100, Math.round(score)), breakdown };
}

module.exports = { calculateCompatibility };

// Progress toward a WEIGHT goal, using the latest logged weight against the
// starting/target snapshot taken when the goal was created. Works for both
// losing and gaining goals since the sign of each delta lines up either way.
export function computeWeightGoalProgress(goal, bodyStats) {
  const latest = bodyStats.length > 0 ? bodyStats[bodyStats.length - 1] : null;
  const currentWeight = latest ? latest.weight : goal.startingWeight;

  const totalDelta = goal.targetWeight - goal.startingWeight;
  const currentDelta = currentWeight - goal.startingWeight;
  const progress = totalDelta === 0 ? 1 : Math.min(1, Math.max(0, currentDelta / totalDelta));

  return {
    currentWeight,
    progress,
    achieved: progress >= 1,
    remaining: Math.round(Math.abs(goal.targetWeight - currentWeight) * 10) / 10,
  };
}

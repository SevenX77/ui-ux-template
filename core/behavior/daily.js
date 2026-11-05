/* Shared daily content/state/geometry policies; stack adapters own DOM, input, clocks and drawing. */
function dailyVisibleMessages(messages, onlyUnread) {
  return messages.filter(message => !onlyUnread || message[2]);
}
function dailyReadMessage(messages, name) {
  return messages.map(message => message[0] === name ? [message[0], message[1], 0] : message);
}
function dailyBackupStep(progress, config) {
  const next = progress + config.increment;
  return {progress: next, width: Math.min(next, config.maximum), count: Math.round(next * config.countFactor), complete: next >= config.maximum};
}
function dailyBooking(tasks, previousBooking, slot, config) {
  const title = config.prefix + slot, next = {...tasks};
  if (previousBooking) next[config.day] = next[config.day].filter(task => task !== previousBooking);
  next[config.day] = [...(next[config.day] || []), title];
  return {tasks: next, booked: title, day: config.day};
}
export {dailyVisibleMessages, dailyReadMessage, dailyBackupStep, dailyBooking};

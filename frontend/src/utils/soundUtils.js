export const createTone = (context, frequency, duration, type) => {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0.3, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    context.currentTime + duration
  );

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration);
};

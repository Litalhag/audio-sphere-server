export function durationToSeconds(duration) {
  const [minutes, seconds] = duration.split(':').map(Number)
  return minutes * 60 + seconds
}

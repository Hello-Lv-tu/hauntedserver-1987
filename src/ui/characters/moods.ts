export type NellMood = 'neutral' | 'happy' | 'cheeky' | 'surprised' | 'scared' | 'sad'
export type JackMood = 'smile' | 'smug' | 'angry'

/** Pick a mood from what she just said (her ASCII smileys and tone). */
export function nellMoodOf(text: string): NellMood {
  if (/:-\(|:\(|\bsorry\b|难过/.test(text)) return 'sad'
  if (/:-O|\?\?!|!\?|\bwhoa\b|\bhuh\b|咦|哇/.test(text)) return 'surprised'
  if (/\bplease\b|\beek\b|locked me|\bno\.|\bNO\b|oh no|求你|呀。|锁起来/.test(text)) return 'scared'
  if (/:-P|;-\)/.test(text)) return 'cheeky'
  if (/:-D|:-\)|!!|\byay\b|BONK|耶|咚/.test(text)) return 'happy'
  return 'neutral'
}

/** Jack's mood from his own line. */
export function jackMoodOf(text: string): JackMood {
  if (/Nooo|cancelled|取消/.test(text)) return 'angry'
  if (/just kidding|Miss me|Yum|Resistance|开玩笑|想我|好吃|抵抗/.test(text)) return 'smug'
  return 'smile'
}

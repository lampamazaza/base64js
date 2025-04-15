const BASE_64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const PADDING = "="
const DECODING_LOOKUP_TABLE = [
  80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
  80, 80, 80, 80, 80, 80, 80, 80, 80, 62, 80, 80, 80, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 80, 80, 80, 64, 80, 80, 80, 0, 1, 2, 3, 4,
  5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 80, 80, 80, 80, 80, 80, 26, 27, 28, 29, 30, 31, 32, 33, 34,
  35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 80, 80, 80, 80, 80
]

export function encode(input: string) {
  const bytes = Buffer.from(input, "utf-8")
  const result: string[] = []
  const lastCompleteTriple = ~~(bytes.length / 3) * 3
  let i = 0
  for (; i < lastCompleteTriple; i += 3) {
    result.push(BASE_64_MAP[bytes[i] >> 2])
    result.push(BASE_64_MAP[((bytes[i] & 0x3) << 4) | ((bytes[i + 1] & 0xf0) >> 4)])
    result.push(BASE_64_MAP[((bytes[i + 1] & 0x0f) << 2) | ((bytes[i + 2] & 0xc0) >> 6)])
    result.push(BASE_64_MAP[bytes[i + 2] & 0x3f])
  }

  if (i < bytes.length) {
    const secondBytePresent = bytes[i + 1] !== undefined
    result.push(BASE_64_MAP[bytes[i] >> 2])
    result.push(BASE_64_MAP[((bytes[i] & 0x3) << 4) | (((secondBytePresent ? bytes[i + 1] : 0x00) & 0xf0) >> 4)])
    if (secondBytePresent) {
      result.push(BASE_64_MAP[(bytes[i + 1] & 0x0f) << 2])
    } else {
      result.push(PADDING)
    }
    result.push(PADDING)
  }

  return result.join("")
}

export function decode(input: string) {
  let isLastQuadrupleIncomplete = false
  let length = input.length
  let streamEndIndexOLastCompleteQuadruple: number
  if (input[length - 1] === PADDING) {
    streamEndIndexOLastCompleteQuadruple = (length / 4 - 1) * 4
    isLastQuadrupleIncomplete = true
  } else {
    streamEndIndexOLastCompleteQuadruple = (length / 4) * 4
  }
  let i = 0

  const result = []
  for (; i < streamEndIndexOLastCompleteQuadruple; i += 4) {
    const s1 = DECODING_LOOKUP_TABLE[input.charCodeAt(i)]
    const s2 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 1)]
    const s3 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 2)]
    const s4 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 3)]

    result.push((s1 << 2) | ((s2 & 0x30) >> 4))
    result.push(((s2 & 0x0f) << 4) | ((s3 & 0x3c) >> 2))
    result.push(((s3 & 0x03) << 6) | (s4 & 0x3f))
  }

  /* decode last quadruple if incomplete */
  if (isLastQuadrupleIncomplete) {
    const s1 = DECODING_LOOKUP_TABLE[input.charCodeAt(i)]
    const s2 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 1)]

    result.push((s1 << 2) | ((s2 & 0x30) >> 4))
    if (input[i + 2] === "=") {
      /* already added first output character */
    } else {
      /* decode second byte of triple */
      const s3 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 2)]
      result.push(((s2 & 0x0f) << 4) | ((s3 & 0x3c) >> 2))
    }
  }
  const decoder = new TextDecoder() // Defaults to UTF-8
  return decoder.decode(new Uint8Array(result))
}

# base64js implementation

## Installation

```bash
bun i
```

## Test


```bash
bun test
```


## Description

A simple js implementation of base64 algo based on this [article](https://www.sunshine2k.de/articles/coding/base64/understanding_base64.html) 


## Encoding algo

### Overall algo
```ts
  const base64Map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  const bytes = Buffer.from("Sun", "utf-8")
  // "Sun" should be converted to "U3Vu"
  const result:string = []
  const i = 0
  // We need to have 4 packs of 6 bits, because max base64 chars has 6 bits. Each 6 bits int is mappen to base64Map
  // bytes[0] = 01010011 ("S"), moving right two bits to get 00010100
  // 00010100 is 20 and when we do base64Map[20] we get character "U"
  result.push(base64Map[bytes[i] >> 2])

  // bytes[0] = 01010011 ("S") taking lower two bits with & 0x3 (00000011) and moving it 4 bits left and getting 110000
  // bytes[1] = 01110101 ("u") taking 4 upper bits with  & 0xf0 (11110000) and moving it 4 bits right and getting 111
  // then merging it with |  (110000 and 000111) and we get 110111 
  // 110111 is 55 and when we do base64Map[55] we get character "3"
  result.push(base64Map[((bytes[i] & 0x3) << 4) | ((bytes[i + 1] & 0xf0) >> 4)])


  // bytes[1] = 01110101 ("u") taking 4 lower bits with  & 0x0f (00001111) and moving it 2 bits left and getting 010100
  // bytes[2] = 01101110 ("n") taking 2 upper bits with  & 0xc0 (11000000) and moving it 6 bits right and getting 00000001 
  // then merging it with |  (010100 and 000001) and we get 010101 
  // 010101 is 21 and when we do base64Map[21] we get character "V" 
  result.push(base64Map[((bytes[i + 1] & 0x0f) << 2) | ((bytes[i + 2] & 0xc0) >> 6)])
  
  // bytes[2] = 01101110 ("n") taking 6 lower bits with  & 0x3f (00111111) and getting 101110
  // 101110 is 46 and when we do base64Map[21] we get character "u"
  result.push(base64Map[bytes[i + 2] & 0x3f])
  const output = result.join("")
  // By joining result we get "U3Vu"
```

### Handling missing bytes at the end

Missing packs of 6 bits are replaced by "=" padding characters.
Three utf8 chars are encoded to 4 base64 chars

### One byte missing in last 8 bytes pack

```ts
  // if one last byte from pack is mising then we get 1 padding character
  const bytes = Buffer.from("Su", "utf-8")
  // "Su" should be converted to "U3U="
  const result:string = []
  const i = 0
  // bytes[0] = 01010011 ("S"), moving right two bits to get 00010100
  // 00010100 is 20 and when we do base64Map[20] we get character "U"
  result.push(base64Map[bytes[i] >> 2])

  // bytes[0] = 01010011 ("S") taking lower two bits with & 0x3 (00000011) and moving it 4 bits left and getting 110000
  // bytes[1] = 01110101 ("u") taking 4 upper bits with  & 0xf0 (11110000) and moving it 4 bits right and getting 111
  // then merging it with |  (110000 and 000111) and we get 110111 
  // 110111 is 55 and when we do base64Map[55] we get character "3"
  result.push(base64Map[((bytes[i] & 0x3) << 4) | ((bytes[i + 1] & 0xf0) >> 4)])

  // bytes[1] = 01110101 ("u") taking 4 lower bits with  & 0x0f (00001111) and moving it 2 bits left and getting 010100
  // bytes[2] is missing so we use 0x00 (00000000)
  // then merging it with |  (010100 and 000000) and we get 010100 
  // 010100 is 20 and when we do base64Map[20] we get character "U" 
  result.push(base64Map[((bytes[i + 1] & 0x0f) << 2) | ((0x00 & 0xc0) >> 6)])
  
  // As the last 3rd byte is missing we add a padding "="
  result.push("=")
  // so the result "U3U="
  let output = result.join("")
```
 
### Two bytes missing in last 8 bytes pack

```ts
  // if 2 byte from pack are missing we get 2 padding character
  const bytes = Buffer.from("S", "utf-8")
  // "S" should be converted to "Uw=="
  const result:string = []
  const i = 0
  // bytes[0] = 01010011 ("S"), moving right two bits to get 00010100
  // 00010100 is 20 and when we do base64Map[20] we get character "U"
  result.push(base64Map[bytes[i] >> 2])

  // bytes[0] = 01010011 ("S") taking lower two bits with & 0x3 (00000011) and moving it 4 bits left and getting 110000
  // bytes[1] is missing so we use 0x00 (00000000)
  // then merging it with |  (110000 and 00000000) and we get 110000 
  // 110000 is 48 and when we do base64Map[48] we get character "w"
  
  // As the last two bytes are missing we add two padding "=" chars
  result.push("=")
  result.push("=")
  let output = result.join("")
  // so the result "Uw=="
```
## Decoding algo

The base 64 string is divided into 4 packs of characters and they are decoded into regular 8bits pack accodring to algo below

```ts
const DECODING_LOOKUP_TABLE = [
  80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80 , 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
  80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 62, 80, 80, 80, 63 , 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
  80, 80, 80, 64, 80, 80 , 80, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 , 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 80, 80, 80, 80, 80 , 80, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40 , 41, 42, 43,
  44, 45, 46, 47, 48, 49, 50, 51, 80, 80, 80, 80, 80 
]
  // Get bytes from base64 string
  const input = Buffer.from("U3Vu", "utf-8") // U3Vu is Sun
  const result:string = []
  const i = 0;
  // get a char code and map against decoding lookup talbe
  const s1 = DECODING_LOOKUP_TABLE[input.charCodeAt(i)]
  const s2 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 1)]
  const s3 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 2)]
  const s4 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 3)]
  // map four 6 bits packages into 8 bits one

  // s1 charcode is 85 taking against decoding lookup table it is 20 in binary it 00010100
  // Moving 2 bits left it is 01010000 
  // s2 charcode is 51 taking against decoding lookup table it is 55 in binary it 00110111
  // 0x30 is 00110000 in binary , doing 00110111 & 00110000 we get 000011
  // doing 01010000 | 00000011 = 01010011 
  // 01010011 is S
  result.push((s1 << 2) | ((s2 & 0x30) >> 4))
  
  // s2 charcode is 51 taking against decoding lookup table it is 55 in binary it 00110111
  // 0x0f is 00001111 doing 00110111 && 00001111 (to get last 4 bits) we get 00000111
  // moving it 4 bits we get 01110000
  // s3 charcode is 86, against lookup table it is 21 in binary it is 00010101
  // 0x3c is 00111100 
  // doing 00010101 & 00111100 (to get 4 first bits) = 00010100
  // moving 00010100 two bits we get 00000101
  // doing 01110000 | 00000101 = 01110101
  // 01110101 is u
  result.push(((s2 & 0x0f) << 4) | ((s3 & 0x3c) >> 2))


  // s3 charcode is 86, against lookup table it is 21 in binary it is 00010101
  // 0x03 is 00000011 
  // doing 00010101 & 00000011 to get two last bits of s3 we get 00000001
  // Moving it 6 bits left we get 01000000
  // s4 charcode is 117 against lookup table it is 46 in binary it is 00101110
  // 0x3f in binary is 00111111
  // we are doing  00101110 && 00111111 do get first six bits
  // the result is 00101110
  // doing 01000000 | 00101110 we get 01101110 which is n
  result.push(((s3 & 0x03) << 6) | (s4 & 0x3f))

  // the end result is "Sun" string
```

### Padding characters handling

If in the last pack of 4 base64 chars there are padding characters '='

  ```ts
  //value of isLastQuadrupleIncomplete is get by checking the end of the string
  if (isLastQuadrupleIncomplete)
    {
        const s1 = DECODING_LOOKUP_TABLE[input.charCodeAt(i)];
        const s2 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 1)];
        // we are getting the first byte the regular way
        result.push(s1 << 2 | ((s2 & 0x30) >> 4));
        if (input[i + 2] === '=')
        {
          // Here the padding is the 3 rd char so we don't do anything as this is the case where
          // the input for this specific case was 1 byte out of 3 bytes pack  (example S string)
        }
        else
        {
          // Here the padding is the 4 rd char so we get the secod byte
          // the input for this specific case was 2 byte out of 3 bytes pack (example Su string)
            /* decode second byte of triple */
            const s3 = DECODING_LOOKUP_TABLE[input.charCodeAt(i + 2)];
            result.push(((s2 & 0x0F) << 4) | ((s3 & 0x3C) >> 2));
        }
    }
    const decoder = new TextDecoder() // Defaults to UTF-8
    return decoder.decode(new Uint8Array(result))
```

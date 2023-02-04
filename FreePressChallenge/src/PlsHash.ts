import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'

const hashAlgorith = 'sha3-256'

export async function plsFileHash(filePath: string): Promise<string> {
  return new Promise((resolve) => {
    const hash = createHash(hashAlgorith)
    const input = createReadStream(filePath)

    input.on('readable', () => {
      const data = input.read();
      if (data) hash.update(data);
      else resolve(hash.digest('hex'))
    })
  })
}

export function plsStringHash(data: string): string {
  const hash = createHash(hashAlgorith)
  hash.update(data)

  return hash.digest('hex')
}

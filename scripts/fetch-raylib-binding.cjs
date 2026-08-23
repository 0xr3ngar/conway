// bun does not run dependency postinstall scripts (tested on bun 1.4.0), so
// raylib's own postinstall never fires and the native binding is missing.
// This downloads the prebuilt N-API addon from the raylib GitHub release.
const fs = require('fs')
const path = require('path')

const VERSION = '0.14.0'
const dir = path.join(__dirname, '..', 'node_modules', 'raylib', 'build', 'Release')
const target = path.join(dir, 'node-raylib.node')

if (fs.existsSync(target)) {
  process.exit(0)
}

const url = `https://github.com/RobLoach/node-raylib/releases/download/v${VERSION}/node-raylib-${process.platform}-${process.arch}.node`

fetch(url)
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return res.arrayBuffer()
  })
  .then((buf) => {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(target, Buffer.from(buf))
    console.log(`Downloaded node-raylib native binding (v${VERSION})`)
  })
  .catch((err) => {
    console.error(`Failed to download node-raylib binding: ${err.message}`)
    console.error('Fallback: cd node_modules/raylib && npm run compile')
    process.exit(1)
  })

import express from 'express'
import path from 'node:path'

const app = express()
const distDir = path.join('/home/claude/project/eminem', 'dist')
app.use(express.static(distDir))
app.get(/^(?!\/api).*/, (_req, res, next) => {
  res.sendFile(path.join(distDir, 'index.html'), (err) => { if (err) next(err) })
})
app.listen(4321, () => console.log('test server up'))

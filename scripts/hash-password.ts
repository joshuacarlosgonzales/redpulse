// scripts/hash-password.ts
import bcrypt from 'bcryptjs'

const password = 'lattegin062102'
const salt = bcrypt.genSaltSync(10)
const hash = bcrypt.hashSync(password, salt)

console.log('Password:', password)
console.log('Hash:', hash)
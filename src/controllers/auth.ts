import { User } from '@fethcat/shared/mongo'
import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import validator from 'validator'
import { z } from 'zod'
import { settings } from '../settings.js'

const schemas = {
  signup: z
    .object({ username: z.string(), password: z.string(), email: z.string() })
    .transform((val) => ({ ...val, username: validator.escape(val.username) })),
  login: z.object({ userOrMail: z.string(), password: z.string() }),
  refreshToken: z
    .string()
    .optional()
    .transform((header) => header?.split(' ')[1]),
}

export async function signup(req: Request, res: Response) {
  const { success, failure } = req.logger.action('singup')
  try {
    const { username, password, email } = schemas.signup.parse(req.body)

    if (!validator.isEmail(email)) return res.status(400).send({ message: 'Invalid email' })

    const existingUser = await User.findOne({ username })
    if (existingUser) return res.status(400).send({ message: 'Username already taken' })

    const { password: pwd, ...user } = (await User.create({ username, password, email })).toObject()

    const accessToken = jwt.sign({ _id: user._id }, settings.auth.accessSecret, { expiresIn: '1h' })
    const refreshToken = jwt.sign({ _id: user._id }, settings.auth.refreshSecret, { expiresIn: '14d' })

    await User.findByIdAndUpdate(user._id, { refreshToken })

    res.status(201).send({ user, accessToken, refreshToken })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function login(req: Request, res: Response) {
  const { success, failure } = req.logger.action('login')
  try {
    const { userOrMail, password } = schemas.login.parse(req.body)

    const key = validator.escape(userOrMail)

    const existingUser = await User.findOne({ $or: [{ username: key }, { email: key }] })
    if (!existingUser) return res.status(400).send({ message: 'Invalid credentials' })

    const approved = bcrypt.compare(password, existingUser.password)
    if (!approved) return res.status(400).send({ message: 'Invalid credentials' })

    const accessToken = jwt.sign({ _id: existingUser._id }, settings.auth.accessSecret, { expiresIn: '1h' })
    const refreshToken = jwt.sign({ _id: existingUser._id }, settings.auth.refreshSecret, { expiresIn: '14d' })

    await User.findByIdAndUpdate(existingUser._id, { refreshToken })

    res.status(200).send({ accessToken, refreshToken })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function refreshToken(req: Request, res: Response) {
  const { success, failure } = req.logger.action('refresh_token')
  try {
    const token = schemas.refreshToken.parse(req.headers.authorization)
    if (!token) return res.status(401).send({ message: 'No token provided' })
    const decoded = jwt.verify(token, settings.auth.refreshSecret)

    const { _id } = z.object({ _id: z.string() }).parse(decoded)
    const user = await User.findById(_id)
    if (!user || user.refreshToken !== token) return res.status(403).send({ message: 'Invalid refresh token' })

    const accessToken = jwt.sign({ _id: user._id }, settings.auth.accessSecret, { expiresIn: '1h' })
    const refreshToken = jwt.sign({ _id: user._id }, settings.auth.refreshSecret, { expiresIn: '14d' })

    await User.findByIdAndUpdate(user._id, { refreshToken })

    res.status(200).send({ accessToken, refreshToken, user })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

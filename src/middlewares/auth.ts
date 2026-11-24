import { NextFunction, Request, Response } from 'express'
import { verify } from 'jsonwebtoken'
import { settings } from '../settings.js'

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token provided' })
    const decoded = verify(token, settings.auth.accessSecret)
    req.currentUser = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token provided is not valid' })
  }
}

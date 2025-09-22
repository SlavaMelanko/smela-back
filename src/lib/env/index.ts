import env from './env'

export const isDevEnv = () => env.NODE_ENV === 'development'
export const isProdEnv = () => env.NODE_ENV === 'production'
export const isTestEnv = () => env.NODE_ENV === 'test'
export const isStagingEnv = () => env.NODE_ENV === 'staging'
export const isDevOrTestEnv = () => isDevEnv() || isTestEnv()
export const isStagingOrProdEnv = () => isStagingEnv() || isProdEnv()

export default env

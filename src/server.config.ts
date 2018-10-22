const env = process.env.NODE_ENV || 'development'

export const serverConfig = {
    // db: 'mongodb://cato:monzter1@ds115546.mlab.com:15546/ca7o',
    db: 'mongodb://ca7o:monzter1@84.52.213.99:27017/ca7o',
    rootPath: __dirname,
    port: env === 'development' ? process.env.PORT || 3001 : process.env.PORT || 5001,
    secret: 'RbBQqA6uF#msRF8s7h*?@=95HUm&DgMDd6zLFn4XzWQ6dtwXSJwBX#?gL2JWf!',
    env: env
};

# README

## Deployment (heroku)
- Add heroku remote as a remote in your current repository: `heroku git:remote -a ca7o-server`
- Deploy code: `git push heroku master`
- The application is now deployed. Ensure that at least one instance of the app is running: `heroku ps:scale web=1`
- Open the app in a browser: `heroku open`
- Tail logs: `heroku logs --tail`
- Check how many dynos are running: `heroku ps`
- Run app locally: `heroku local -p 1337`
- So that dev dependencies from package.json get installed: heroku config:set NPM_CONFIG_PRODUCTION=false --app ca7o-server

## Stuff
- npm ls -g --depth 0

## Run the stuff
- npm run build // (or just 'gulp') build server
- npm start // node ./dist/start.js

## Mean App Server
- http://brianflove.com/2017/07/16/mean-app-server/

## tsconfig
- https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
- http://brianflove.com/2017/07/16/mean-app-angular-material/
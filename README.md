# bids-2
Build Status: [![Circle CI](https://circleci.com/gh/USStateDept/BIDS.svg?style=svg&circle-token=dbffe40b7d79a7d7f4dd955a14fa39bedb6ad71d)](https://circleci.com/gh/USStateDept/BIDS)

# Install (notes)
## Install node, npm & postgres on your development machine

* create a db user
* make sure the db user is set to md5 (instead of token or ident) in pg_hba.conf (more)
* create a db called bids2

## Clone etc

* git clone this repo

```
cd bids2/
npm install
npm install nodemon -g
```
* make the following changes
  * copy config/development.example.js to config/development.js
* in **public/scripts/bids.js** you will need to add your own google api key to the end of this line  ***$.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address=***

# Install front-end dependencies for the project

## Install Bower
```
npm install -g bower
```
## Install dependencies
```
bower install
```

## Setup DB

### Install Postgresql
* Install Postgres App: http://postgresapp.com/
 *OR*
* Install through brew
```
brew install postgres
```

### Install Knex CLI
```
  npm install knex -g
```

* Run these commands using the environment specified; eg: --production, default is development*

* DB configuration settings are located in knexfile.js

To create a new database, run migrations and seed the database
```
  gulp db:recreate
```
Create a new Database
```
  gulp db:create
```
Run run migrations and seed data
```
  gulp db:migrate-and-seed
```
Just run latest migrations
```
  knex migrate:latest
```
Ingest seed data into the database
```
  knex seed:run
```
Drop the database
```
  gulp db:drop
```

*NOTE* Please take a look at Knex documentation for more information how to
operate migrations.

# Starting the Application

## Install browser-sync and Gulp
```
npm install -g browser-sync
npm install -g gulp

```

## Start in development
```
gulp
```

## Start in production
Run the deploy task with the production env flag
```
gulp deploy --production
```

Install forever
```
npm install forever -g
```

Start the app using forever
```
forever start app.js
```


## Tests
Limited unit testing (as of 2/6/2016) is availabe via:
```
npm test
```

## Continuous Integration
Circle CI support has been added

To contribute to this repo push your feature branch and do a PR against DEVEL. If the PR is acceptable it will be merged into devel and then to master via the CI process.

**DO NOT PULL REQUEST AGAINST MASTER**

=======
# BIDS
Business Information Database System

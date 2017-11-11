#!/bin/bash

# Setup script, installing everything to get the server running

# NODE
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt-get install nodejs

# NPM
apt-get install npm
npm install express
npm install mysql

# POLYMER
npm install -g bower
npm install -g polymer-cli
bower install polymer/polymer#2.0.0 --allow-root

# MYSQL
apt-get install mysql-client
apt-get install mysql-server


echo "\n\n\nBase installation is DONE\n\n"
echo "Now you need to configure the mysql server and a systemd process to keep the server running."
echo "\n To config the mysql database, run \"$mysql -u root -p\""
echo "Inside the mysql shell, run \"create database db;\" or whataver the database is called (inside app.js)"
echo "\n\n"

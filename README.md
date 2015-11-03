ses-mock
========

SES mock server. Currently only supports the sendEmail method. Saves all email to a folder.

## Installation

    $ npm install ses-mock

## Configuration

This module uses the AWS SDK, so it is expected that the SDK is configured globally using the standard methods.

## Usage

    $ node server.js

### Options

#### --port

The port that the server should run on (default `9555`).

#### --outputFolder

The folder where messages are stored (default `./output`)

#### Author: Keith Hamasaki
